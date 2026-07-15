namespace SBLMS.Domain.Common.Enums;

public enum MeetingStatus
{
    Scheduled = 0,
    Completed = 1,
    Cancelled = 2
}

public enum MeetingType
{
    GoogleMeet = 0,
    MicrosoftTeams = 1,
    Zoom = 2,
    Webex = 3,
    PhoneCall = 4,
    InPerson = 5
}

public enum MeetingSetupStatus
{
    NotStarted = 0,
    SettingUp = 1,
    Ready = 2,
    SentToClient = 3,
    Accepted = 4,
    Declined = 5
}

public enum ClientMeetingResponse
{
    Pending = 0,
    Accepted = 1,
    Declined = 2
}
