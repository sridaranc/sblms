const fs = require('fs');

const path = '/Users/csridaran/Projects/SBLMS/frontend/src/features/attendance/AttendancePage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Interface definition
content = content.replace(/checkIn: string;/g, 'checkInTime?: string;');
content = content.replace(/checkOut\?: string;/g, 'checkOutTime?: string;');
content = content.replace(/hours\?: number;/g, 'hoursWorked?: number;');
content = content.replace(/faceVerified: boolean;/g, 'faceVerifiedCheckIn: boolean;');
content = content.replace(/faceDistance\?: number;/g, 'faceDistanceCheckIn?: number;');
content = content.replace(/status: 'present' \| 'late' \| 'absent' \| 'halfday';/g, "status: string;");

// Object property accesses
content = content.replace(/\.checkIn/g, '.checkInTime');
content = content.replace(/\.checkOut/g, '.checkOutTime');
content = content.replace(/\.hours/g, '.hoursWorked');
content = content.replace(/\.faceVerified/g, '.faceVerifiedCheckIn');
content = content.replace(/\.faceDistance/g, '.faceDistanceCheckIn');

// We also need to fix status checks because it comes as "Present", "Late" from API.
// E.g. record.status === 'present' -> record.status?.toLowerCase() === 'present'
content = content.replace(/r\.status === 'present'/g, "r.status?.toLowerCase() === 'present'");
content = content.replace(/r\.status === 'late'/g, "r.status?.toLowerCase() === 'late'");
content = content.replace(/r\.status !== 'absent'/g, "r.status?.toLowerCase() !== 'absent'");
content = content.replace(/record\.status === 'present'/g, "record.status?.toLowerCase() === 'present'");
content = content.replace(/record\.status === 'late'/g, "record.status?.toLowerCase() === 'late'");
content = content.replace(/todayRecord\.status === 'late'/g, "todayRecord.status?.toLowerCase() === 'late'");
content = content.replace(/record\?\.status === 'present'/g, "record?.status?.toLowerCase() === 'present'");
content = content.replace(/record\?\.status === 'late'/g, "record?.status?.toLowerCase() === 'late'");

// Fix the calculation line: attendanceService.calculateHours(prev.checkInTime, now.toISOString())
// prev.checkInTime is optional now, so we need to pass a fallback or ensure it exists.
content = content.replace(/calculateHours\(prev\.checkInTime, now\.toISOString\(\)\)/g, "calculateHours(prev.checkInTime!, now.toISOString())");

// Fix new Date(record.checkInTime) if it's undefined
content = content.replace(/new Date\(record\.checkInTime\)/g, "new Date(record.checkInTime!)");
content = content.replace(/new Date\(todayRecord\.checkInTime\)/g, "new Date(todayRecord.checkInTime!)");
content = content.replace(/new Date\(todayRecord\.checkOutTime\)/g, "new Date(todayRecord.checkOutTime!)");
content = content.replace(/new Date\(record\.checkOutTime\)/g, "new Date(record.checkOutTime!)");

// Fix specific table cells that now need null checks
content = content.replace(/<TableCell>{attendanceService\.formatTime\(new Date\(record\.checkInTime!\)\)}<\/TableCell>/g, "<TableCell>{record.checkInTime ? attendanceService.formatTime(new Date(record.checkInTime)) : '-'}</TableCell>");

// For checkInTime and checkOutTime being renamed when we are setting them in setTodayRecord
content = content.replace(/checkInTime: now\.toISOString\(\),/g, "checkInTime: now.toISOString(),");
content = content.replace(/checkInLocationTime:/g, "checkInLocation:"); // just in case
content = content.replace(/checkOutLocationTime:/g, "checkOutLocation:"); // just in case

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed!");
