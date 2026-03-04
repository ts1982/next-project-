"""
stop.py — auto-stop スケジュール削除 → Edge Stack 削除 → RDS スナップショット取得 & 完全削除

RDS を stop ではなく delete する理由:
  停止した RDS は 7 日後に AWS によって自動起動されるため、コストが発生する。
  スナップショットを取得してから完全削除することで、停止中のコストをゼロにする。

スナップショット命名:
  タイムスタンプ + UUID サフィックス ({PROJECT_NAME}-final-snap-{unix_time}-{uuid8}) で一意性を保証する。
  並行実行やリトライが同一秒に発生しても衝突しない。
  start.py は「最新の manual スナップショット」を動的に検索して復元する。

環境変数:
  PROJECT_NAME    : CloudFormation スタック名プレフィックス (default: next-project)
  RDS_INSTANCE_ID : RDS インスタンス識別子
"""

import json
import os
import time
import uuid

import boto3

PROJECT_NAME = os.environ.get("PROJECT_NAME", "next-project")
RDS_INSTANCE_ID = os.environ["RDS_INSTANCE_ID"]

# タイムスタンプ + UUID サフィックスで一意なスナップショット名を生成（衝突なし・削除待ち不要）
SNAPSHOT_PREFIX = f"{PROJECT_NAME}-final-snap"

rds = boto3.client("rds")
cfn = boto3.client("cloudformation")
scheduler = boto3.client("scheduler")

EDGE_STACK_NAME = f"{PROJECT_NAME}-edge"
SCHEDULE_NAME = f"{PROJECT_NAME}-auto-stop"


def handler(event, context):
    source = event.get("source", "manual")
    print(f"[stop] Stopping environment (source: {source})...")

    # 1) auto-stop スケジュールが残っていれば削除（手動停止の場合の cleanup）
    delete_auto_stop_schedule()

    # 2) Edge Stack 削除 (ALB + ECS Service + DNS + Lambda + NAT GW)
    delete_edge_stack()

    # 3) Edge Stack 削除完了待機 (最大 ~10 分)
    wait_edge_stack_deleted()

    # 4) RDS 完全削除（スナップショット保存後）
    delete_rds()

    print("[stop] Environment is down!")
    return {"statusCode": 200, "body": json.dumps({"message": "stopped"})}


# ---- Auto-stop Schedule ----
def delete_auto_stop_schedule():
    try:
        scheduler.delete_schedule(Name=SCHEDULE_NAME)
        print("[scheduler] Deleted auto-stop schedule")
    except scheduler.exceptions.ResourceNotFoundException:
        print("[scheduler] No auto-stop schedule found (already deleted or expired)")
    except Exception as e:
        print(f"[scheduler] Error deleting schedule: {e}")


# ---- Edge Stack ----
def delete_edge_stack():
    try:
        cfn.describe_stacks(StackName=EDGE_STACK_NAME)
        print(f"[cfn] Deleting stack {EDGE_STACK_NAME}...")
        cfn.delete_stack(StackName=EDGE_STACK_NAME)
    except cfn.exceptions.ClientError as e:
        if "does not exist" in str(e):
            print(f"[cfn] Stack {EDGE_STACK_NAME} does not exist, skipping")
        else:
            raise


def wait_edge_stack_deleted():
    """Edge Stack 削除完了を待機 (最大 ~10 分)。Lambda 15 分制限に余裕を持たせる。"""
    print(f"[cfn] Waiting for {EDGE_STACK_NAME} deletion...")
    try:
        waiter = cfn.get_waiter("stack_delete_complete")
        waiter.wait(
            StackName=EDGE_STACK_NAME,
            WaiterConfig={"Delay": 15, "MaxAttempts": 40},  # max ~10 min
        )
        print("[cfn] Edge stack deleted!")
    except Exception as e:
        err_msg = str(e)
        if "does not exist" in err_msg:
            print("[cfn] Stack already gone")
        elif "Max attempts exceeded" in err_msg:
            print("[cfn] WARNING: Deletion waiter timed out — proceeding anyway")
        else:
            raise


# ---- RDS ----

# RDS が削除可能な状態に達するまで待機する対象ステータス
_DELETABLE_STATUSES = {"available", "stopped", "incompatible-parameters", "incompatible-restore"}

# 過渡状態（しばらく待てば削除可能ステータスへ遷移する）
_TRANSITIONAL_STATUSES = {
    "starting", "stopping", "rebooting", "modifying",
    "upgrading", "configuring-enhanced-monitoring",
    "storage-optimization", "resetting-master-credentials",
    "renaming", "restoring",
}


def wait_rds_deletable():
    """RDS が削除可能なステータスに達するまでポーリング待機（最大 15 分）。"""
    for attempt in range(90):  # 90 × 10s = 15 min
        resp = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
        status = resp["DBInstances"][0]["DBInstanceStatus"]
        if status in _DELETABLE_STATUSES:
            print(f"[rds] Status: {status} — ready to delete")
            return status
        if status in _TRANSITIONAL_STATUSES:
            print(f"[rds] Status: {status} — waiting... ({attempt + 1}/90)")
            time.sleep(10)
        else:
            raise RuntimeError(f"[rds] Unexpected status: {status} — cannot proceed")
    raise TimeoutError("[rds] Timed out waiting for deletable state")


def delete_rds():
    """RDS を完全削除する。7 日後の自動起動を防ぐため stop ではなく delete を使用。"""
    try:
        resp = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
        status = resp["DBInstances"][0]["DBInstanceStatus"]
        print(f"[rds] Current status: {status}")

        # 過渡状態なら削除可能になるまで待機
        if status not in _DELETABLE_STATUSES:
            if status in _TRANSITIONAL_STATUSES:
                status = wait_rds_deletable()
            else:
                raise RuntimeError(f"[rds] Cannot delete in status: {status}")

        # タイムスタンプ + UUID サフィックスで一意なスナップショット名（並行実行・リトライ時の衝突なし）
        snapshot_id = f"{SNAPSHOT_PREFIX}-{int(time.time())}-{uuid.uuid4().hex[:8]}"
        print(f"[rds] Deleting instance with final snapshot: {snapshot_id}")

        rds.delete_db_instance(
            DBInstanceIdentifier=RDS_INSTANCE_ID,
            SkipFinalSnapshot=False,
            FinalDBSnapshotIdentifier=snapshot_id,
            DeleteAutomatedBackups=True,
        )
        print("[rds] Delete requested (final snapshot will be created)")

    except rds.exceptions.DBInstanceNotFoundFault:
        print("[rds] Instance not found (already deleted)")
    except Exception as e:
        print(f"[rds] Error: {e}")
        raise
