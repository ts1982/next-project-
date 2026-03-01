"""
start.py — RDS 起動 → Edge Stack 作成 → 5 時間後 auto-stop スケジュール作成

環境変数:
  PROJECT_NAME      : CloudFormation スタック名プレフィックス (default: next-project)
  RDS_INSTANCE_ID   : RDS インスタンス識別子
  EDGE_TEMPLATE_URL : Edge Stack の S3 テンプレート URL
  AUTO_STOP_HOURS   : 自動停止までの時間 (default: 5)
  STOP_LAMBDA_ARN   : 停止 Lambda の ARN
  SCHEDULER_ROLE_ARN: EventBridge Scheduler が Lambda を呼ぶ際のロール ARN
"""

import json
import os
import time
from datetime import datetime, timedelta, timezone

import boto3

PROJECT_NAME = os.environ.get("PROJECT_NAME", "next-project")
RDS_INSTANCE_ID = os.environ["RDS_INSTANCE_ID"]
EDGE_TEMPLATE_URL = os.environ["EDGE_TEMPLATE_URL"]
AUTO_STOP_HOURS = int(os.environ.get("AUTO_STOP_HOURS", "5"))
STOP_LAMBDA_ARN = os.environ["STOP_LAMBDA_ARN"]
SCHEDULER_ROLE_ARN = os.environ["SCHEDULER_ROLE_ARN"]

rds = boto3.client("rds")
cfn = boto3.client("cloudformation")
scheduler = boto3.client("scheduler")

EDGE_STACK_NAME = f"{PROJECT_NAME}-edge"
SCHEDULE_NAME = f"{PROJECT_NAME}-auto-stop"


def handler(event, context):
    print("[start] Starting environment...")

    # 1) RDS 起動
    start_rds()

    # 2) RDS available 待機 (通常 5-10 分)
    wait_rds_available()

    # 3) Edge Stack 作成 (非同期 — Lambda は完了を待たない)
    create_edge_stack()

    # 4) auto-stop スケジュール作成 (現在 + AUTO_STOP_HOURS)
    create_auto_stop_schedule()

    print("[start] RDS is up. Edge Stack is being created (async).")
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
def start_rds():
    try:
        status = rds.describe_db_instances(
            DBInstanceIdentifier=RDS_INSTANCE_ID
        )["DBInstances"][0]["DBInstanceStatus"]
        print(f"[rds] Current status: {status}")
        if status == "stopped":
            rds.start_db_instance(DBInstanceIdentifier=RDS_INSTANCE_ID)
            print("[rds] Start requested")
        elif status == "available":
            print("[rds] Already running")
        else:
            print(f"[rds] Unexpected status: {status}, proceeding anyway")
    except Exception as e:
        print(f"[rds] Error: {e}")
        raise


def wait_rds_available():
    print("[rds] Waiting for available state...")
    waiter = rds.get_waiter("db_instance_available")
    waiter.wait(
        DBInstanceIdentifier=RDS_INSTANCE_ID,
        WaiterConfig={"Delay": 30, "MaxAttempts": 24},  # max ~12 min
    )
    print("[rds] Available!")


# ---- Edge Stack (async — does not wait for completion) ----
def create_edge_stack():
    try:
        cfn.describe_stacks(StackName=EDGE_STACK_NAME)
        print(f"[cfn] Stack {EDGE_STACK_NAME} already exists, updating...")
        cfn.update_stack(
            StackName=EDGE_STACK_NAME,
            TemplateURL=EDGE_TEMPLATE_URL,
            Parameters=[
                {"ParameterKey": "ProjectName", "ParameterValue": PROJECT_NAME},
            ],
            Capabilities=["CAPABILITY_NAMED_IAM"],
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
