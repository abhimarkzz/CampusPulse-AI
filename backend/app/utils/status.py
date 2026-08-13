from app.models.domain import ComplaintStatus

VALID_TRANSITIONS: dict[ComplaintStatus, set[ComplaintStatus]] = {
    ComplaintStatus.PENDING: {ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.REJECTED, ComplaintStatus.ASSIGNED},
    ComplaintStatus.ACKNOWLEDGED: {ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.ASSIGNED: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.WAITING_FOR_STUDENT},
    ComplaintStatus.IN_PROGRESS: {
        ComplaintStatus.WAITING_FOR_STUDENT,
        ComplaintStatus.WAITING_FOR_EXTERNAL_TEAM,
        ComplaintStatus.RESOLUTION_SUBMITTED,
    },
    ComplaintStatus.WAITING_FOR_STUDENT: {ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.WAITING_FOR_EXTERNAL_TEAM: {ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.RESOLUTION_SUBMITTED: {ComplaintStatus.RESOLVED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.RESOLVED: {ComplaintStatus.CLOSED, ComplaintStatus.REOPENED},
    ComplaintStatus.CLOSED: {ComplaintStatus.REOPENED},
    ComplaintStatus.REOPENED: {ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.REJECTED: set(),
}


def can_transition(current: ComplaintStatus, target: ComplaintStatus) -> bool:
    return target in VALID_TRANSITIONS.get(current, set())
