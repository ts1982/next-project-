"""
infra_notify.py — CloudFormation スタックステータス変更 → Slack 通知 Lambda

EventBridge ルールで CloudFormation の「Stack Status Change」イベントをキャッチし、
Edge Stack の作成完了/失敗/削除完了を Slack に通知する。

これにより、PC のセッションに依存せず AWS 側で通知が完結する。

イベント例 (EventBridge → Lambda):
{
  "detail-type": "CloudFormation Stack Status Change",
  "source": "aws.cloudformation",
  "detail": {
    "stack-id": "arn:aws:cloudformation:...:stack/next-project-edge/...",
    "status-details": {
      "status": "CREATE_COMPLETE"
    }
  }
}

環境変数:
  PROJECT_NAME : CloudFormation スタック名プレフィックス (default: next-project)
"""

from slack_notify import notify_stack_event

# 通知対象のステータス（中間状態は無視）
_NOTIFY_STATUSES = {
    "CREATE_COMPLETE",
    "CREATE_FAILED",
    "UPDATE_COMPLETE",
    "UPDATE_ROLLBACK_COMPLETE",
    "ROLLBACK_COMPLETE",
    "DELETE_COMPLETE",
    "DELETE_FAILED",
}


def handler(event, context):
    print(f"[infra_notify] Received event: {event}")

    detail = event.get("detail", {})
    stack_id = detail.get("stack-id", "")
    status_details = detail.get("status-details", {})
    status = status_details.get("status", "")

    # stack-id から stack 名を抽出 (arn:aws:cloudformation:...:stack/STACK_NAME/UUID)
    stack_name = stack_id.split("/")[1] if "/" in stack_id else stack_id

    print(f"[infra_notify] Stack: {stack_name}, Status: {status}")

    if status not in _NOTIFY_STATUSES:
        print(f"[infra_notify] Ignoring status: {status}")
        return {"statusCode": 200, "body": "ignored"}

    notify_stack_event(stack_name, status)

    return {"statusCode": 200, "body": f"notified: {status}"}
