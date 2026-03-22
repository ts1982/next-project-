"""
start.py — RDS 復元/起動 → Edge Stack 作成 → 5 時間後 auto-stop スケジュール作成

RDS インスタンスが存在しない場合はスナップショットから復元する。
(stop.py で RDS を完全削除しているため、通常は復元フローになる)

スナップショット検索:
  stop.py はタイムスタンプ付きの名前でスナップショットを作成するため、
  このスクリプトは「{PROJECT_NAME}-final-snap-」プレフィックスの最新 manual スナップショットを
  動的に検索して復元する（SNAPSHOT_ID 環境変数は不要）。

環境変数:
  PROJECT_NAME          : CloudFormation スタック名プレフィックス (default: next-project)
  RDS_INSTANCE_ID       : RDS インスタンス識別子
  EDGE_TEMPLATE_URL     : Edge Stack の S3 テンプレート URL
  AUTO_STOP_HOURS       : 自動停止までの時間 (default: 5)
  STOP_LAMBDA_ARN       : 停止 Lambda の ARN
  SCHEDULER_ROLE_ARN    : EventBridge Scheduler が Lambda を呼ぶ際のロール ARN
  RDS_SECURITY_GROUP_ID : RDS セキュリティグループ ID
  DB_SUBNET_GROUP_NAME  : DB サブネットグループ名
"""

import json
import os
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit, urlunsplit

import boto3

PROJECT_NAME = os.environ.get("PROJECT_NAME", "next-project")
RDS_INSTANCE_ID = os.environ["RDS_INSTANCE_ID"]
EDGE_TEMPLATE_URL = os.environ["EDGE_TEMPLATE_URL"]
AUTO_STOP_HOURS = int(os.environ.get("AUTO_STOP_HOURS", "5"))
STOP_LAMBDA_ARN = os.environ["STOP_LAMBDA_ARN"]
SCHEDULER_ROLE_ARN = os.environ["SCHEDULER_ROLE_ARN"]
RDS_SECURITY_GROUP_ID = os.environ["RDS_SECURITY_GROUP_ID"]
DB_SUBNET_GROUP_NAME = os.environ["DB_SUBNET_GROUP_NAME"]
CFN_ROLE_ARN = os.environ["CFN_ROLE_ARN"]

SNAPSHOT_PREFIX = f"{PROJECT_NAME}-final-snap"

rds = boto3.client("rds")
cfn = boto3.client("cloudformation")
scheduler = boto3.client("scheduler")
ssm = boto3.client("ssm")

EDGE_STACK_NAME = f"{PROJECT_NAME}-edge"
SCHEDULE_NAME = f"{PROJECT_NAME}-auto-stop"


def handler(event, context):
    print("[start] Starting environment...")

    try:
        # 1) RDS 起動 or スナップショットから復元
        ensure_rds()

        # 2) RDS available 待機 (通常 5-10 分)
        wait_rds_available()

        # 3) SSM DATABASE_URL を新しい RDS エンドポイントで更新
        update_ssm_database_url()

        # 4) Edge Stack 作成 (非同期 — Lambda は完了を待たない)
        create_edge_stack()
    except Exception as e:
        print(f"[start] ERROR: {e}")
        from slack_notify import notify_start_error
        notify_start_error(e)
        raise
    finally:
        # 5) auto-stop スケジュール作成 (現在 + AUTO_STOP_HOURS)
        # Edge Stack 作成の成否にかかわらず、RDS が起動していればコスト発生するため必ずスケジュールする
        try:
            create_auto_stop_schedule()
        except Exception as e:
            print(f"[start] WARNING: Failed to create auto-stop schedule: {e}")

    print("[start] RDS is up, DATABASE_URL synced. Edge Stack is being created (async).")
    print("[start] Check progress: aws cloudformation describe-stacks "
          f"--stack-name {EDGE_STACK_NAME}")
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "RDS started, Edge Stack creating...",
            "edgeStack": EDGE_STACK_NAME,
            "note": "Edge Stack takes ~5-10 min to complete after this response.",
        }),
    }


# ---- RDS ----
def ensure_rds():
    """RDS インスタンスが存在すれば起動、なければスナップショットから復元する。"""
    try:
        resp = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
        status = resp["DBInstances"][0]["DBInstanceStatus"]
        print(f"[rds] Current status: {status}")
        if status == "stopped":
            rds.start_db_instance(DBInstanceIdentifier=RDS_INSTANCE_ID)
            print("[rds] Start requested")
        elif status == "available":
            print("[rds] Already running")
        else:
            print(f"[rds] Status: {status}, waiting...")
    except rds.exceptions.DBInstanceNotFoundFault:
        print("[rds] Instance not found — restoring from snapshot...")
        restore_rds_from_snapshot()


def get_latest_snapshot_id() -> str:
    """SNAPSHOT_PREFIX に一致する最新の manual スナップショットを返す。"""
    resp = rds.describe_db_snapshots(
        DBInstanceIdentifier=RDS_INSTANCE_ID,
        SnapshotType="manual",
    )
    snapshots = [
        s for s in resp["DBSnapshots"]
        if s["DBSnapshotIdentifier"].startswith(SNAPSHOT_PREFIX)
        and s["Status"] == "available"
    ]
    if not snapshots:
        raise ValueError(
            f"[rds] No available snapshot found with prefix '{SNAPSHOT_PREFIX}'. "
            "Cannot restore."
        )
    snapshots.sort(key=lambda s: s["SnapshotCreateTime"], reverse=True)
    latest = snapshots[0]["DBSnapshotIdentifier"]
    print(f"[rds] Using snapshot: {latest}")
    return latest


def restore_rds_from_snapshot():
    """最新のファイナルスナップショットから RDS インスタンスを復元する。
    VpcSecurityGroupIds を restore 時に指定することで、
    available 後の modify が不要になり一時的なデフォルト SG 適用を回避する。
    """
    snapshot_id = get_latest_snapshot_id()
    rds.restore_db_instance_from_db_snapshot(
        DBInstanceIdentifier=RDS_INSTANCE_ID,
        DBSnapshotIdentifier=snapshot_id,
        DBInstanceClass="db.t4g.micro",
        DBSubnetGroupName=DB_SUBNET_GROUP_NAME,
        VpcSecurityGroupIds=[RDS_SECURITY_GROUP_ID],
        PubliclyAccessible=False,
        MultiAZ=False,
        Tags=[{"Key": "Name", "Value": f"{PROJECT_NAME}-db"}],
    )
    print("[rds] Restore requested")


def wait_rds_available():
    print("[rds] Waiting for available state...")
    waiter = rds.get_waiter("db_instance_available")
    waiter.wait(
        DBInstanceIdentifier=RDS_INSTANCE_ID,
        WaiterConfig={"Delay": 30, "MaxAttempts": 30},  # max ~15 min
    )
    print("[rds] Available!")


# ---- SSM DATABASE_URL 更新 ----
def update_ssm_database_url():
    """RDS 復元後にエンドポイントが変わるため、SSM の DATABASE_URL を新しいホストに更新する。"""
    param_name = f"/{PROJECT_NAME}/DATABASE_URL"

    # 新しい RDS エンドポイントを取得
    resp = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
    new_host = resp["DBInstances"][0]["Endpoint"]["Address"]
    print(f"[ssm] New RDS endpoint: {new_host}")

    # 現在の DATABASE_URL を取得
    param = ssm.get_parameter(Name=param_name, WithDecryption=True)
    current_url = param["Parameter"]["Value"]

    # urllib.parse で URL を解析してホスト部分のみを確実に置換する
    # (ポート無し URL や IPv6 ホストにも対応)
    parsed = urlsplit(current_url)
    # netloc の userinfo 部分(既にパーセントエンコード済み)をそのまま保持して
    # ホストのみを差し替える。username/password を decode→再 encode するより安全。
    at_pos = parsed.netloc.rfind("@")
    if at_pos != -1:
        userinfo = parsed.netloc[:at_pos]
        netloc = f"{userinfo}@{new_host}"
    else:
        netloc = new_host
    if parsed.port:
        netloc += f":{parsed.port}"
    new_url = urlunsplit(parsed._replace(netloc=netloc))

    if new_url == current_url:
        print("[ssm] DATABASE_URL already up to date")
        return

    ssm.put_parameter(Name=param_name, Value=new_url, Type="SecureString", Overwrite=True)
    print("[ssm] DATABASE_URL updated")


# 失敗状態のスタック（削除→再作成が必要）
_FAILED_STATUSES = {"ROLLBACK_COMPLETE", "CREATE_FAILED", "ROLLBACK_FAILED", "DELETE_FAILED"}

# 操作中の状態（待機してからリトライするか、そのままスキップ）
_IN_PROGRESS_STATUSES = {
    "CREATE_IN_PROGRESS", "UPDATE_IN_PROGRESS", "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
    "UPDATE_ROLLBACK_IN_PROGRESS", "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
}


# ---- Edge Stack (async — does not wait for completion) ----
def create_edge_stack():
    try:
        resp = cfn.describe_stacks(StackName=EDGE_STACK_NAME)
        status = resp["Stacks"][0]["StackStatus"]
        print(f"[cfn] Stack {EDGE_STACK_NAME} status: {status}")

        if status in _IN_PROGRESS_STATUSES:
            print(f"[cfn] Stack is {status} — skipping (already in progress)")
            return

        if status in _FAILED_STATUSES:
            print(f"[cfn] Stack in {status} state, deleting before recreate...")
            cfn.delete_stack(StackName=EDGE_STACK_NAME)
            waiter = cfn.get_waiter("stack_delete_complete")
            waiter.wait(StackName=EDGE_STACK_NAME, WaiterConfig={"Delay": 10, "MaxAttempts": 60})
            print(f"[cfn] Deleted failed stack, creating fresh...")
            cfn.create_stack(
                StackName=EDGE_STACK_NAME,
                TemplateURL=EDGE_TEMPLATE_URL,
                Parameters=[
                    {"ParameterKey": "ProjectName", "ParameterValue": PROJECT_NAME},
                ],
                Capabilities=["CAPABILITY_NAMED_IAM"],
                RoleARN=CFN_ROLE_ARN,
            )
        else:
            print(f"[cfn] Updating stack {EDGE_STACK_NAME}...")
            cfn.update_stack(
                StackName=EDGE_STACK_NAME,
                TemplateURL=EDGE_TEMPLATE_URL,
                Parameters=[
                    {"ParameterKey": "ProjectName", "ParameterValue": PROJECT_NAME},
                ],
                Capabilities=["CAPABILITY_NAMED_IAM"],
                RoleARN=CFN_ROLE_ARN,
            )
    except cfn.exceptions.ClientError as e:
        if "does not exist" in str(e):
            print(f"[cfn] Creating stack {EDGE_STACK_NAME}...")
            cfn.create_stack(
                StackName=EDGE_STACK_NAME,
                TemplateURL=EDGE_TEMPLATE_URL,
                Parameters=[
                    {"ParameterKey": "ProjectName", "ParameterValue": PROJECT_NAME},
                ],
                Capabilities=["CAPABILITY_NAMED_IAM"],
                RoleARN=CFN_ROLE_ARN,
            )
        elif "No updates are to be performed" in str(e):
            print("[cfn] No changes needed")
            return
        else:
            raise


# ---- Auto-stop Schedule ----
def create_auto_stop_schedule():
    stop_at = datetime.now(timezone.utc) + timedelta(hours=AUTO_STOP_HOURS)
    # EventBridge Scheduler の at() 式: at(yyyy-mm-ddThh:mm:ss)
    schedule_expr = f"at({stop_at.strftime('%Y-%m-%dT%H:%M:%S')})"
    print(f"[scheduler] Auto-stop at {stop_at.isoformat()} ({schedule_expr})")

    try:
        scheduler.delete_schedule(Name=SCHEDULE_NAME)
        print("[scheduler] Deleted existing schedule")
    except scheduler.exceptions.ResourceNotFoundException:
        pass

    scheduler.create_schedule(
        Name=SCHEDULE_NAME,
        ScheduleExpression=schedule_expr,
        ScheduleExpressionTimezone="UTC",
        FlexibleTimeWindow={"Mode": "OFF"},
        Target={
            "Arn": STOP_LAMBDA_ARN,
            "RoleArn": SCHEDULER_ROLE_ARN,
            "Input": json.dumps({"source": "auto-stop"}),
        },
        ActionAfterCompletion="DELETE",
    )
    print("[scheduler] Auto-stop schedule created")
