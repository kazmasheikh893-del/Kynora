"""
Sample inbox for the Kynora prototype.

Each entry has two parts:
  - the raw email a real inbox would contain (sender, subject, body, ...)
  - a `mock_analysis` block, which is what MockAIAnalyzer hands back for
    that specific email instead of "thinking" from scratch.

`hours_ago` / `deadline_in_days` are relative offsets rather than fixed
dates, so the inbox always looks current (dates in "Today" / "Yesterday" /
deadlines a few days out) no matter when you actually run the app.

This file is the single source of truth for demo data -- both the raw
`Email` objects and the analysis the mock analyzer returns come from here.
When Phase 2 adds real Gmail sync, this file is what gets replaced by a
live email service; nothing downstream needs to change.
"""

from __future__ import annotations

from typing import Any

SAMPLE_EMAILS: list[dict[str, Any]] = [
    {
        "id": "e1",
        "sender_name": "TechNova Careers",
        "sender_email": "careers@technova-hire.com",
        "subject": "Action needed: complete your internship application today",
        "preview": "Your application for the Software Engineering Internship is almost complete. We just need two more things before the deadline...",
        "body": (
            "Hi,\n\n"
            "Thanks for starting your application for the Software Engineering Internship at TechNova. "
            "You're almost done -- we still need your updated resume and a completed online assessment "
            "before we can move your application forward.\n\n"
            "Please note that incomplete applications are not carried over to the next intake, so we'd "
            "encourage you to finish these steps as soon as possible.\n\n"
            "Best,\nTechNova Campus Hiring Team"
        ),
        "hours_ago": 3,
        "is_read": False,
        "mock_analysis": {
            "category": "Internship",
            "priority": "Urgent",
            "summary": "TechNova needs your resume and assessment to finalize your internship application.",
            "action_required": True,
            "action": "Upload your resume and complete the online assessment before the deadline.",
            "deadline_in_days": 1,
            "sender_importance": "Recruiter/Company",
            "confidence": 0.94,
        },
    },
    {
        "id": "e2",
        "sender_name": "Examination Cell",
        "sender_email": "examcell@stcollege.edu",
        "subject": "Semester End Examination Timetable Released",
        "preview": "The final examination timetable for this semester has been published on the student portal...",
        "body": (
            "Dear Student,\n\n"
            "The timetable for the Semester End Examinations has been published on the student portal. "
            "Please check your seating arrangement and exam dates carefully.\n\n"
            "Students are advised to bring their ID cards and hall tickets to every exam. Any timetable "
            "clashes must be reported to the examination cell within 2 days.\n\n"
            "Examination Cell\nState College of Engineering"
        ),
        "hours_ago": 20,
        "is_read": False,
        "mock_analysis": {
            "category": "College",
            "priority": "High",
            "summary": "The examination cell released the semester-end timetable; your first paper is in six days.",
            "action_required": True,
            "action": "Check the portal for your exam dates and seating details, and report any clashes.",
            "deadline_in_days": 6,
            "sender_importance": "Institutional",
            "confidence": 0.92,
        },
    },
    {
        "id": "e3",
        "sender_name": "Account Security",
        "sender_email": "security-alerts@accountwatch.com",
        "subject": "Unusual sign-in activity detected on your account",
        "preview": "We noticed a sign-in from a new device in a different location. If this wasn't you, secure your account now...",
        "body": (
            "We detected a sign-in to your account from a new device and location that doesn't match your "
            "usual activity.\n\n"
            "If this was you, no action is needed. If you don't recognize this activity, we recommend "
            "changing your password immediately and reviewing your recent account activity.\n\n"
            "Account Security Team"
        ),
        "hours_ago": 5,
        "is_read": False,
        "mock_analysis": {
            "category": "Security",
            "priority": "High",
            "summary": "A sign-in from an unrecognized device was flagged on your account and needs review.",
            "action_required": True,
            "action": "Review the recent sign-in activity and change your password if you don't recognize it.",
            "deadline_in_days": None,
            "sender_importance": "Automated System",
            "confidence": 0.90,
        },
    },
    {
        "id": "e4",
        "sender_name": "Placement Cell",
        "sender_email": "placements@stcollege.edu",
        "subject": "Pre-Placement Talk: Meridian Systems -- Registration Closing Soon",
        "preview": "Meridian Systems will be conducting a pre-placement talk on campus. Register before slots fill up...",
        "body": (
            "Dear Student,\n\n"
            "Meridian Systems will be visiting campus for a pre-placement talk followed by a Q&A session. "
            "Attendance is strongly recommended for students planning to apply through the placement drive.\n\n"
            "Seats are limited and registration closes soon, so please register on the placement portal at "
            "the earliest.\n\n"
            "Placement Cell\nState College of Engineering"
        ),
        "hours_ago": 30,
        "is_read": False,
        "mock_analysis": {
            "category": "Placement",
            "priority": "High",
            "summary": "Meridian Systems is holding a pre-placement talk and registration closes in two days.",
            "action_required": True,
            "action": "Register on the placement portal before the deadline to reserve your seat.",
            "deadline_in_days": 2,
            "sender_importance": "Institutional",
            "confidence": 0.88,
        },
    },
    {
        "id": "e5",
        "sender_name": "GitHub",
        "sender_email": "notifications@github.com",
        "subject": "[kynora-prototype] Review requested on pull request #14",
        "preview": "A teammate requested your review on 'Add priority sorting to inbox view'...",
        "body": (
            "You have been requested to review a pull request.\n\n"
            "Repository: kynora-prototype\n"
            "Pull request #14: \"Add priority sorting to inbox view\"\n\n"
            "View the diff and leave your comments on GitHub."
        ),
        "hours_ago": 8,
        "is_read": False,
        "mock_analysis": {
            "category": "GitHub",
            "priority": "Medium",
            "summary": "A pull request in your repository is waiting on your review.",
            "action_required": True,
            "action": "Review pull request #14 and leave your feedback.",
            "deadline_in_days": None,
            "sender_importance": "Automated System",
            "confidence": 0.85,
        },
    },
    {
        "id": "e6",
        "sender_name": "LearnForge",
        "sender_email": "certificates@learnforge.io",
        "subject": "Your certificate is ready: Introduction to Cloud Computing",
        "preview": "Congratulations on completing the course! Your certificate is now available to download...",
        "body": (
            "Congratulations on finishing Introduction to Cloud Computing!\n\n"
            "Your certificate of completion is now ready. You can download it from your LearnForge "
            "dashboard and share it on your resume or professional profiles.\n\n"
            "Keep up the momentum -- your next recommended course is Cloud Networking Fundamentals."
        ),
        "hours_ago": 50,
        "is_read": False,
        "mock_analysis": {
            "category": "Certification",
            "priority": "Medium",
            "summary": "Your Introduction to Cloud Computing certificate is ready to download.",
            "action_required": False,
            "action": "Download it and consider adding it to your resume or LinkedIn profile.",
            "deadline_in_days": None,
            "sender_importance": "Automated System",
            "confidence": 0.80,
        },
    },
    {
        "id": "e7",
        "sender_name": "TechFest Committee",
        "sender_email": "techfest@stcollege.edu",
        "subject": "TechFest 2026 registrations are open -- early bird ends soon",
        "preview": "Register for TechFest 2026 before the early bird window closes to lock in discounted passes...",
        "body": (
            "TechFest 2026 is here!\n\n"
            "Registrations are now open for all events, workshops, and competitions. Early bird passes are "
            "discounted for a limited time -- after that, prices go up for everyone.\n\n"
            "Grab your pass before the early bird window closes.\n\nTechFest Committee"
        ),
        "hours_ago": 40,
        "is_read": False,
        "mock_analysis": {
            "category": "College",
            "priority": "Medium",
            "summary": "TechFest 2026 registration is open, with early bird pricing ending in four days.",
            "action_required": True,
            "action": "Register before the early bird deadline if you want the discounted pass.",
            "deadline_in_days": 4,
            "sender_importance": "Institutional",
            "confidence": 0.82,
        },
    },
    {
        "id": "e8",
        "sender_name": "Prof. R. Sharma",
        "sender_email": "r.sharma@stcollege.edu",
        "subject": "New lecture uploaded: Data Structures -- Week 6",
        "preview": "This week's lecture on balanced binary search trees is now available on the course page...",
        "body": (
            "Hello all,\n\n"
            "This week's Data Structures lecture, covering balanced binary search trees, has been "
            "uploaded to the course page along with the slides.\n\n"
            "The associated problem set is optional practice and will not be graded.\n\nProf. R. Sharma"
        ),
        "hours_ago": 15,
        "is_read": True,
        "mock_analysis": {
            "category": "College",
            "priority": "Medium",
            "summary": "A new Data Structures lecture on balanced binary search trees has been posted.",
            "action_required": False,
            "action": None,
            "deadline_in_days": None,
            "sender_importance": "Institutional",
            "confidence": 0.75,
        },
    },
    {
        "id": "e9",
        "sender_name": "Ananya Verma",
        "sender_email": "ananya.verma@stcollege.edu",
        "subject": "Re: Group project -- can we sync tomorrow?",
        "preview": "Hey, can we get on a call tomorrow evening to divide the remaining sections before submission?...",
        "body": (
            "Hey,\n\n"
            "Can we hop on a call tomorrow evening? We still need to divide the remaining sections of the "
            "report and I'd rather sort that out before the weekend.\n\n"
            "Let me know what time works for you.\n\nAnanya"
        ),
        "hours_ago": 4,
        "is_read": False,
        "mock_analysis": {
            "category": "General",
            "priority": "Medium",
            "summary": "A groupmate wants to schedule a call tomorrow to divide the remaining project work.",
            "action_required": True,
            "action": "Reply with a time that works for the group call.",
            "deadline_in_days": None,
            "sender_importance": "Peer",
            "confidence": 0.78,
        },
    },
    {
        "id": "e10",
        "sender_name": "The Weekly Stack",
        "sender_email": "digest@theweeklystack.com",
        "subject": "This week in tech: 5 stories you shouldn't miss",
        "preview": "From new frameworks to hiring trends -- here's what mattered in tech this week...",
        "body": (
            "This week's top stories:\n\n"
            "1. A new frontend framework promises faster builds\n"
            "2. Hiring trends for new graduates in the next year\n"
            "3. A deep dive into vector databases\n"
            "4. Five open-source projects worth watching\n"
            "5. What changed in this month's major cloud provider updates\n\n"
            "Read the full digest on our site."
        ),
        "hours_ago": 60,
        "is_read": True,
        "mock_analysis": {
            "category": "Newsletter",
            "priority": "Low",
            "summary": "A weekly roundup of tech news and industry stories.",
            "action_required": False,
            "action": None,
            "deadline_in_days": None,
            "sender_importance": "Marketing",
            "confidence": 0.70,
        },
    },
    {
        "id": "e11",
        "sender_name": "LinkedIn",
        "sender_email": "jobs-noreply@linkedin.com",
        "subject": "5 new jobs match your profile",
        "preview": "Based on your profile, here are roles you might be interested in this week...",
        "body": (
            "We found new job postings that match your profile and interests.\n\n"
            "Software Engineer Intern -- 3 companies hiring\n"
            "Frontend Developer -- 2 companies hiring\n\n"
            "View all recommended jobs on LinkedIn."
        ),
        "hours_ago": 26,
        "is_read": True,
        "mock_analysis": {
            "category": "Newsletter",
            "priority": "Low",
            "summary": "LinkedIn surfaced five job listings that match your profile.",
            "action_required": False,
            "action": None,
            "deadline_in_days": None,
            "sender_importance": "Marketing",
            "confidence": 0.65,
        },
    },
    {
        "id": "e12",
        "sender_name": "SkillSprint",
        "sender_email": "offers@skillsprint.com",
        "subject": "50% off all courses -- today only",
        "preview": "Our biggest sale of the season ends tonight. Upgrade your skills at half price...",
        "body": (
            "Our biggest sale of the year is happening right now -- 50% off every course on SkillSprint, "
            "today only.\n\nBrowse courses and use code TODAY50 at checkout."
        ),
        "hours_ago": 70,
        "is_read": True,
        "mock_analysis": {
            "category": "Promotion",
            "priority": "Low",
            "summary": "A limited-time discount promotion on SkillSprint courses.",
            "action_required": False,
            "action": None,
            "deadline_in_days": None,
            "sender_importance": "Marketing",
            "confidence": 0.60,
        },
    },
    {
        "id": "e13",
        "sender_name": "Rohan Mehta",
        "sender_email": "rohan.mehta@gmail.com",
        "subject": "Lunch this weekend?",
        "preview": "It's been a while! Want to grab lunch on Saturday if you're free?...",
        "body": (
            "Hey, it's been a while!\n\n"
            "Want to grab lunch on Saturday if you're free? There's a new place near campus I've been "
            "wanting to try.\n\nLet me know!\n\nRohan"
        ),
        "hours_ago": 2,
        "is_read": False,
        "mock_analysis": {
            "category": "General",
            "priority": "Low",
            "summary": "A friend is asking if you're free for lunch on Saturday.",
            "action_required": True,
            "action": "Let Rohan know if Saturday works for you.",
            "deadline_in_days": None,
            "sender_importance": "Peer",
            "confidence": 0.72,
        },
    },
]
