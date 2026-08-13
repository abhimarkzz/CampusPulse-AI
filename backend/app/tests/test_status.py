from app.utils.status import can_transition
from app.models.domain import ComplaintStatus


def test_valid_status_transition():
    assert can_transition(ComplaintStatus.PENDING, ComplaintStatus.ACKNOWLEDGED)
    assert not can_transition(ComplaintStatus.REJECTED, ComplaintStatus.RESOLVED)
