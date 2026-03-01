"""
stop.py — auto-stop スケジュール削除 → Edge Stack (ALB含む) 削除 → RDS 停止

環境変数:
  PROJECT_NAME    : CloudFormation スタック名プレフィックス (default: next-project)
  RDS_INSTANCE_ID : RDS インスタンス識別子
"""

import json
import os
import time

import boto3

PROJECT_NAME = os.environ.get("PROJECT_NAME", "next-project")
RDS_INSTANCE_ID = os.environ["RDS_INSTANCE_ID"]

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

    # 2) Edge Stack 削除 (ALB + ECS Service + DNS + cron rule)
    delete_edge_stack()

    # 3) Edge Stack 削除完了待機 (最大 ~10 分)
    wait_edge_stack_deleted()

    # 4) RDS 停止 (ECS タスク停止後に実行)
    stop_rds()

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
            print("[cfn] WARNING: Deletion waiter timed out — proceeding to stop RDS anyway")
        else:
            raise


# ---- RDS ----
def stop_rds():
    try:
        status = rds.describe_db_instances(
            DBInstanceIdentifier=RDS_INSTANCE_ID
        )["DBInstances"][0]["DBInstanceStatus"]
        print(f"[rds] Current status: {status}")
        if status == "available":
            rds.stop_db_instance(DBInstanceIdentifier=RDS_INSTANCE_ID)
            print("[rds] Stop requested")
        elif status == "stopped":
            print("[rds] Already stopped")
        else:
            print(f"[rds] Unexpected status: {status}, skipping stop")
    except Exception as e:
        print(f"[rds] Error: {e}")
        raise
