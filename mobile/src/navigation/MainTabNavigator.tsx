import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/Ionicons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailScreen from '../screens/leads/LeadDetailScreen';
import AiLeadsScreen from '../screens/aileads/AiLeadsScreen';
import ClientsListScreen from '../screens/clients/ClientsListScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import FollowUpsScreen from '../screens/followups/FollowUpsScreen';
import FollowUpFormScreen from '../screens/followups/FollowUpFormScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import UsersScreen from '../screens/users/UsersScreen';
import FaceEnrolmentScreen from '../screens/faceenrolment/FaceEnrolmentScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import { TeamAttendanceScreen } from '../screens/attendance/TeamAttendanceScreen';
import MeetingFormScreen from '../screens/meetings/MeetingFormScreen';

const Tab = createBottomTabNavigator();
const LeadsStack = createNativeStackNavigator();
const AiLeadsStack = createNativeStackNavigator();
const ClientsStack = createNativeStackNavigator();
const FollowUpsStack = createNativeStackNavigator();
const CalendarStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AttendanceStack = createNativeStackNavigator();

const LeadsStackNavigator = () => (
  <LeadsStack.Navigator screenOptions={{ headerShown: false }}>
    <LeadsStack.Screen name="LeadsList" component={LeadsListScreen} />
    <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} />
    <LeadsStack.Screen name="CreateMeeting" component={MeetingFormScreen} />
    <LeadsStack.Screen name="CreateFollowUp" component={FollowUpFormScreen} />
  </LeadsStack.Navigator>
);

const AiLeadsStackNavigator = () => (
  <AiLeadsStack.Navigator screenOptions={{ headerShown: false }}>
    <AiLeadsStack.Screen name="AiLeadsList" component={AiLeadsScreen} />
  </AiLeadsStack.Navigator>
);

const ClientsStackNavigator = () => (
  <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
    <ClientsStack.Screen name="ClientsList" component={ClientsListScreen} />
    <ClientsStack.Screen name="ClientDetail" component={ClientDetailScreen} />
  </ClientsStack.Navigator>
);

const FollowUpsStackNavigator = () => (
  <FollowUpsStack.Navigator screenOptions={{ headerShown: false }}>
    <FollowUpsStack.Screen name="FollowUpsList" component={FollowUpsScreen} />
    <FollowUpsStack.Screen name="FollowUpForm" component={FollowUpFormScreen} />
  </FollowUpsStack.Navigator>
);

const CalendarStackNavigator = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="CalendarList" component={CalendarScreen} />
  </CalendarStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="Users" component={UsersScreen} />
    <ProfileStack.Screen name="FaceEnrolment" component={FaceEnrolmentScreen} />
  </ProfileStack.Navigator>
);

const AttendanceStackNavigator = () => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    <AttendanceStack.Screen name="AttendanceMain" component={AttendanceScreen} />
    <AttendanceStack.Screen name="TeamAttendance" component={TeamAttendanceScreen} />
  </AttendanceStack.Navigator>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Dashboard': iconName = focused ? 'home' : 'home-outline'; break;
            case 'AI Leads': iconName = focused ? 'sparkles' : 'sparkles-outline'; break;
            case 'Leads': iconName = focused ? 'people' : 'people-outline'; break;
            case 'Clients': iconName = focused ? 'business' : 'business-outline'; break;
            case 'FollowUps': iconName = focused ? 'checkbox' : 'checkbox-outline'; break;
            case 'Calendar': iconName = focused ? 'calendar' : 'calendar-outline'; break;
            case 'Attendance': iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline'; break;
            case 'Notifications': iconName = focused ? 'notifications' : 'notifications-outline'; break;
            case 'Reports': iconName = focused ? 'bar-chart' : 'bar-chart-outline'; break;
            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 4, height: 56 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="AI Leads" component={AiLeadsStackNavigator} />
      <Tab.Screen name="Leads" component={LeadsStackNavigator} />
      <Tab.Screen name="Clients" component={ClientsStackNavigator} />
      <Tab.Screen name="FollowUps" component={FollowUpsStackNavigator} />
      <Tab.Screen name="Calendar" component={CalendarStackNavigator} />
      <Tab.Screen name="Attendance" component={AttendanceStackNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
