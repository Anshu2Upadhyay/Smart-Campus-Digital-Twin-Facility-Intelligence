import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { playEmergencySiren, playWorkorderAlert } from '../../utils/soundEffects';
import MOCK_ASSETS from '../../utils/mockAssets';
import CampusMap from '../../components/CampusMap';
import SpatialDigitalTwin2D from '../../components/SpatialDigitalTwin2D';
import {
  AlertTriangle,
  Wrench,
  Bot,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  Navigation,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Building,
  User,
  Shield,
  HelpCircle,
  X,
  MessageSquare,
  MapPin,
  ExternalLink,
  Bell,
  Check,
  Search,
  Calendar,
  Phone,
  Paperclip,
  Flame,
  Zap,
  Snowflake,
  Droplets,
  Tv,
  Armchair,
  Brush,
  ChevronRight,
  MoreVertical,
  Star,
  Download,
  Home,
  FileSpreadsheet,
  GraduationCap,
  Megaphone,
  Folder,
  CheckCircle2,
  PhoneCall,
  Menu,
  BookOpen,
  Coffee,
  Layers,
  Award,
  Compass,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CATEGORIES = [
  { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'HVAC_AC', label: 'AC / Cooling', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'PLUMBING', label: 'Plumbing', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'IT_AV', label: 'IT / Projector', icon: Tv, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'CIVIL_CARPENTRY', label: 'Furniture', icon: Armchair, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'HOUSEKEEPING', label: 'Cleanliness', icon: Brush, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const QUICK_PROMPTS = [
  { label: 'Exam Date Sheet', icon: '📄', query: 'Mid-sem exam kab se hain aur late fee fine kitna hai?' },
  { label: 'Syllabus', icon: '📘', query: 'Computer Science 3rd semester syllabus and credit scheme?' },
  { label: 'Fee Structure', icon: '💳', query: 'Annual tuition fee and installment dates?' },
  { label: 'Scholarship', icon: '🎓', query: 'UP government scholarship eligibility and document list?' },
  { label: 'Hostel Timings', icon: '⏰', query: 'Hostel gate curfew timings and night-out pass policy?' },
  { label: 'Placement', icon: '💼', query: 'Average package and campus recruitment rules for 2026?' },
  { label: 'Library Info', icon: '📚', query: 'Central library timings and maximum book issue limit?' },
  { label: 'Transport', icon: '🚌', query: 'Campus bus routes and schedule for Noida & Delhi?' },
  { label: 'Other Queries', icon: '💬', query: 'How to apply for official campus bona fide certificate?' },
];

export const EndUserDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const { isDarkMode, toggleTheme } = useTheme();

  const { tabSlug } = useParams();
  const navigate = useNavigate();

  const TAB_SLUG_MAP = {
    'dashboard': 'Dashboard',
    'complaint': 'Raise Complaint',
    'tickets': 'My Tickets',
    'map': 'Campus Map',
    'timetable': 'Timetable',
    'academic': 'Academic',
    'notices': 'Notices',
    'hostel': 'Hostel',
    'resources': 'Resources',
    'events': 'Events',
    'campusgpt': 'CampusGPT',
  };

  const REVERSE_SLUG_MAP = {
    'Dashboard': 'dashboard',
    'Raise Complaint': 'complaint',
    'My Tickets': 'tickets',
    'Campus Map': 'map',
    'Timetable': 'timetable',
    'Academic': 'academic',
    'Notices': 'notices',
    'Hostel': 'hostel',
    'Resources': 'resources',
    'Events': 'events',
    'CampusGPT': 'campusgpt',
  };

  // Active Sidebar Nav
  const [activeNav, setActiveNav] = useState(
    (tabSlug && TAB_SLUG_MAP[tabSlug.toLowerCase()]) || 'Dashboard'
  );

  useEffect(() => {
    if (tabSlug && TAB_SLUG_MAP[tabSlug.toLowerCase()]) {
      setActiveNav(TAB_SLUG_MAP[tabSlug.toLowerCase()]);
    }
  }, [tabSlug]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [portalMapMode, setPortalMapMode] = useState('2D');

  // SOS State
  const [sosActive, setSosActive] = useState(false);
  const [sosDetails, setSosDetails] = useState(null);
  const [sosBlock, setSosBlock] = useState('Block-B');
  const [triggeringSos, setTriggeringSos] = useState(false);

  // Complaint Form State
  const [selectedCategory, setSelectedCategory] = useState('ELECTRICAL');
  const [blockName, setBlockName] = useState('Block-B');
  const [floorNumber, setFloorNumber] = useState(2);
  const [roomNumber, setRoomNumber] = useState('Lab 102');
  const [description, setDescription] = useState('Projector not working and fan making noise.');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Active Ticket Tracking State
  const [myTickets, setMyTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // CampusGPT State
  const [chatCategory, setChatCategory] = useState('Ask');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'user',
      text: 'Mid-sem exam kab se hain aur late fee fine kitna hai?',
      timestamp: '10:28 AM',
    },
    {
      role: 'assistant',
      text: 'Aapke college ka Mid-Sem Exam schedule (odd semester 2026-27) niche diya gaya hai:',
      table: [
        { event: 'Mid-Sem Exams Start', date: '25 October 2026' },
        { event: 'Mid-Sem Exams End', date: '5 November 2026' },
        { event: 'Regular Exam Form Deadline', date: '10 October 2026' },
        { event: 'Late Fee (After Deadline)', date: '₹500 per subject' },
      ],
      note: 'Yeh dates AKTU academic calendar ke according hain. Apne branch ya department specific updates ke liye official circular bhi check kar sakte hain.',
      circular_pdf: 'Official_Exam_Circular_2026.pdf',
      pdf_size: '2.4 MB',
      timestamp: '10:28 AM',
    },
  ]);
  const [gptQuery, setGptQuery] = useState('');
  const [gptLoading, setGptLoading] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState(null);

  // Load User Complaints & Active Tickets from Backend
  const loadMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await axiosClient.get('/facility/my-complaints');
      const tickets = res.data?.complaints || (Array.isArray(res.data) ? res.data : []);
      setMyTickets(tickets);
      if (tickets.length > 0) {
        setActiveTicket((prev) => prev || tickets[0]);
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, []);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadMyTickets();
    }
  }, [notifications]);

  // Handle SOS Emergency Trigger
  const handleTriggerSos = async () => {
    setTriggeringSos(true);
    playEmergencySiren();

    const triggerApi = async (lat, lng) => {
      try {
        const res = await axiosClient.post('/sos/trigger', {
          lat,
          lng,
          block_name: sosBlock,
          incident_type: 'PANIC_SOS',
          emergency_note: 'One-Tap Panic Alert from Student Portal!',
        });

        setSosActive(true);
        setSosDetails(res.data);
        setNotificationBanner({
          type: 'emergency',
          message: '🚨 PANIC SOS BROADCASTED! Security Head & nearest guard alerted in < 2 seconds.',
        });
        loadMyTickets();
      } catch (err) {
        setNotificationBanner({
          type: 'error',
          message: err.response?.data?.detail || 'Failed to trigger SOS.',
        });
      } finally {
        setTriggeringSos(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => triggerApi(pos.coords.latitude, pos.coords.longitude),
        () => triggerApi(28.6139, 77.209),
        { timeout: 3000 }
      );
    } else {
      triggerApi(28.6139, 77.209);
    }
  };

  // Handle Grievance Submit
  const handleSubmitGrievance = async (e) => {
    if (e) e.preventDefault();
    if (!description.trim()) return;
    setSubmittingComplaint(true);

    try {
      const res = await axiosClient.post('/facility/complaints', {
        category: selectedCategory,
        block_name: blockName,
        floor_number: Number(floorNumber),
        room_number: roomNumber,
        description,
      });

      playWorkorderAlert();
      setNotificationBanner({
        type: 'success',
        message: '✅ Complaint submitted successfully! Dispatched to facility supervisor.',
      });

      setDescription('');
      loadMyTickets();
      if (res.data?.complaint) {
        setActiveTicket(res.data.complaint);
      }
    } catch (err) {
      setNotificationBanner({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to lodge complaint.',
      });
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Handle CampusGPT Ask
  const handleAskCampusGpt = async (queryText) => {
    const question = queryText || gptQuery;
    if (!question.trim()) return;

    const userMessage = {
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setGptQuery('');
    setGptLoading(true);

    try {
      const res = await axiosClient.post('/campusgpt/ask', { question });
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data?.answer || res.data?.reply || 'Response generated from campus regulatory gazette.',
          circular_ref: res.data?.source_circular || 'Circular #ACAD/2026/01',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Mid-Sem exams are scheduled from 25th October to 5th November 2026 as per official circular #ACAD/2026. Late fee fine is ₹500 per subject.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setGptLoading(false);
    }
  };

  // Fallback demo ticket if user hasn't raised complaints yet
  const defaultTicket = {
    id: 'TK-1042',
    complaint_code: 'TK-1042',
    title: 'Lab 102 – Fan / Projector Issue',
    category: 'ELECTRICAL',
    block_name: 'Block-B',
    floor_number: 2,
    room_number: 'Lab 102',
    status: 'IN_PROGRESS',
    created_at: '14 Oct 2026, 10:15 AM',
    assigned_worker_name: 'Amit Kumar',
    worker_role: 'Electrician',
    worker_badge: 'EMP-078',
    worker_rating: '4.8',
    timeline_steps: [
      { title: 'Submitted', description: 'Complaint filed and logged', completed: true, timestamp: '10:15 AM' },
      { title: 'Verified & Assigned', description: 'Assigned to Electrician Amit Kumar', completed: true, timestamp: '10:16 AM' },
      { title: 'Worker En Route', description: 'Amit Kumar is on the way (15m away)', completed: true, timestamp: '10:18 AM' },
      { title: 'Resolved with Live Proof', description: 'Work verified & completed', completed: false, timestamp: 'Estimated: 10:30 AM' },
    ],
  };

  const currentDisplayTicket = activeTicket || (myTickets.length > 0 ? myTickets[0] : defaultTicket);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'} flex font-sans antialiased relative`}>
      {/* =================================================================== */}
      {/* LEFT NAVIGATION SIDEBAR (Dark Navy #0a1128) */}
      {/* =================================================================== */}
      <aside
        className={`w-64 bg-[#0a1128] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 fixed md:static inset-y-0 left-0 z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#0a1128] rounded-[10px] flex items-center justify-center">
                <Building className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight">Smart Campus</div>
              <div className="text-[10px] text-slate-400 tracking-wider">Student & Faculty Portal</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-semibold">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: Home },
            { id: 'Raise Complaint', label: 'Raise Complaint', icon: Wrench },
            { id: 'My Tickets', label: 'My Tickets', icon: FileSpreadsheet, badge: myTickets.length || 1 },
            { id: 'Campus Map', label: 'Campus Map', icon: Navigation },
            { id: 'Timetable', label: 'Timetable', icon: Calendar },
            { id: 'Academic', label: 'Academic', icon: GraduationCap },
            { id: 'Notices', label: 'Notices', icon: Megaphone, badge: 3 },
            { id: 'Hostel', label: 'Hostel', icon: Building },
            { id: 'Resources', label: 'Resources', icon: Folder },
            { id: 'Events', label: 'Events', icon: Sparkles },
            { id: 'CampusGPT', label: 'CampusGPT', icon: Bot },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                  const targetSlug = REVERSE_SLUG_MAP[item.id] || 'dashboard';
                  navigate(`/campus/portal/${targetSlug}`);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] flex items-center justify-center font-bold border border-blue-400/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Help & Support */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
          >
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>Emergency Help & Directory</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* =================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* =================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className={`h-16 ${isDarkMode ? 'bg-[#0d1527] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} border-b px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm relative z-20`}>
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms, facilities, timetable, notices..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-mono text-slate-400 hidden sm:inline">
                Ctrl K
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Bell Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Campus Alerts</span>
                    <button
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="font-bold text-blue-900 text-[11px]">Ticket Update</div>
                      <p className="text-[10px] text-blue-700 mt-0.5">Electrician Amit assigned to Lab 102.</p>
                      <span className="text-[9px] text-blue-500 font-mono">2 mins ago</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="font-bold text-amber-900 text-[11px]">Library Timings Extended</div>
                      <p className="text-[10px] text-amber-700 mt-0.5">Central reading room open till 1:00 AM.</p>
                      <span className="text-[9px] text-amber-500 font-mono">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timetable Quick Switch */}
            <button
              onClick={() => setActiveNav('Timetable')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Class Timetable"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Dynamic Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              <img
                src={MOCK_ASSETS.avatars.rahulSharma}
                alt="Rahul Sharma"
                className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/30"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.name || 'Rahul Sharma'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.role === 'FACULTY' ? 'Associate Professor' : 'B.Tech CSE (2nd Year)'}
                </div>
              </div>

              {/* Direct Top-Bar Sign Out Button (Strictly Single Logout Point) */}
              <button
                onClick={logout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ml-2"
                title="Sign Out of Student Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Inner Content Padding */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-5 flex-1">
          {/* Notification Alert Banner */}
          {notificationBanner && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
                notificationBanner.type === 'emergency'
                  ? 'bg-red-50 border-red-300 text-red-800 animate-pulse'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{notificationBanner.message}</span>
              </div>
              <button
                onClick={() => setNotificationBanner(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* =================================================================== */}
          {/* VIEW ROUTING BASED ON activeNav */}
          {/* =================================================================== */}

          {/* VIEW 1: MAIN DASHBOARD (3-Column Overview) */}
          {activeNav === 'Dashboard' && (
            <>
              {/* SOS EMERGENCY BANNER (One-Tap Panic Alert) */}
              <div className="relative rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 shadow-lg shadow-red-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleTriggerSos}
                    disabled={triggeringSos}
                    className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/80 flex items-center justify-center font-black text-sm tracking-wider shadow-inner active:scale-95 transition-all shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center font-extrabold shadow-sm">
                      SOS
                    </div>
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-black tracking-wide">SOS EMERGENCY</h2>
                      <span className="text-xs font-medium text-red-100 opacity-90 hidden sm:inline">
                        • One-Tap Panic Alert
                      </span>
                    </div>
                    <p className="text-xs text-red-100 font-medium mt-0.5">
                      Get help immediately! Alerts Security Head &amp; nearest guard in &lt; 2 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 self-end md:self-center">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-sm border border-white/15 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <div>
                      <div className="font-bold text-white leading-none">Browser GPS Active</div>
                      <div className="text-[10px] text-red-200 font-mono mt-0.5">
                        Lat: 28.6139, Lng: 77.2090
                      </div>
                    </div>
                  </div>

                  <select
                    value={sosBlock}
                    onChange={(e) => setSosBlock(e.target.value)}
                    className="bg-black/25 text-white font-bold text-xs rounded-xl px-3 py-2 border border-white/20 focus:outline-none"
                  >
                    <option value="Block-B" className="bg-slate-900 text-white">Block-B</option>
                    <option value="Block-A" className="bg-slate-900 text-white">Block-A</option>
                    <option value="Block-C" className="bg-slate-900 text-white">Block-C</option>
                    <option value="Central Library" className="bg-slate-900 text-white">Library</option>
                  </select>

                  <button
                    onClick={handleTriggerSos}
                    className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                    title="Trigger Instant SOS Alert"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* MAIN 3-COLUMN WORKSPACE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* COLUMN 1: RAISE CAMPUS COMPLAINT */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Raise Campus Complaint</h3>
                        <p className="text-[10px] text-slate-400">Report any issue in your campus</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Need Help?
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Select Issue Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isSelected
                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/30'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center mb-1.5`}>
                              <Icon className={`w-4 h-4 ${cat.color}`} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Location</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <select
                        value={blockName}
                        onChange={(e) => setBlockName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="Block-B">Block-B</option>
                        <option value="Block-A">Block-A</option>
                        <option value="Block-C">Block-C</option>
                      </select>

                      <select
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value={1}>Floor 1</option>
                        <option value={2}>Floor 2</option>
                        <option value={3}>Floor 3</option>
                      </select>

                      <select
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="Lab 102">Lab 102</option>
                        <option value="Room 204">Room 204</option>
                        <option value="Seminar Hall">Seminar Hall</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Add Photo (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1 border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                        <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[9px] text-slate-500 font-medium">Click to upload</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img src={MOCK_ASSETS.projectorFault} alt="preview" className="w-full h-16 object-cover" />
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-white text-[8px] font-mono">
                          Projector
                        </span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-200">
                        <img src={MOCK_ASSETS.switchboard} alt="preview" className="w-full h-16 object-cover" />
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-white text-[8px] font-mono">
                          Socket
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Describe the Issue</label>
                      <span className="text-[10px] text-slate-400 font-mono">{description.length}/300</span>
                    </div>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                      placeholder="Describe what needs repair..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSubmitGrievance}
                    disabled={submittingComplaint}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingComplaint ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
                  </button>
                </div>

                {/* COLUMN 2: SWIGGY-STYLE LIVE TRACKING */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {currentDisplayTicket.complaint_code || currentDisplayTicket.ticket_id || currentDisplayTicket.id || 'Ticket #1042'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            ● {currentDisplayTicket.status || 'Live Tracking'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                          {currentDisplayTicket.title || `${currentDisplayTicket.category || 'Maintenance'} in ${currentDisplayTicket.room_number || 'Room'}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {currentDisplayTicket.block_name} • {currentDisplayTicket.room_number} • {currentDisplayTicket.created_at || '14 Oct 2026, 10:15 AM'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveNav('My Tickets')}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {/* Dynamic Timeline Steps */}
                  <div className="space-y-3">
                    {(currentDisplayTicket.timeline_steps || defaultTicket.timeline_steps).map((step, idx) => {
                      const isComplete = step.completed;
                      return (
                        <div key={idx} className="relative pl-7 pb-3 border-l-2 border-emerald-400 ml-3 last:border-l-0">
                          <div
                            className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm font-bold ${
                              isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{step.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{step.timestamp || 'Just now'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>

                          {/* Extra info for step 2: Worker mini card */}
                          {idx === 1 && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={MOCK_ASSETS.avatars.amitKumar}
                                  alt="Worker"
                                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                                />
                                <div>
                                  <div className="text-xs font-bold text-slate-800">
                                    {currentDisplayTicket.assigned_worker_name || 'Amit Kumar'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Electrician • EMP-078 • <span className="text-amber-500 font-bold">★ 4.8</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-200">
                                  On the Way
                                </span>
                                <a
                                  href="tel:+919876543210"
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Extra info for step 3: 3D Isometric Mini Route Map */}
                          {idx === 2 && (
                            <div className="mt-2 rounded-xl bg-slate-100 border border-slate-200 p-2.5 relative overflow-hidden flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={MOCK_ASSETS.avatars.amitKumar}
                                  alt="Amit"
                                  className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500"
                                />
                                <div className="text-[10px] font-mono text-slate-600">
                                  <div className="font-bold text-slate-800">{currentDisplayTicket.block_name || 'Block-B'}</div>
                                  <div>Floor {currentDisplayTicket.floor_number || 2}</div>
                                </div>
                              </div>
                              <div className="flex-1 px-3 flex items-center">
                                <div className="w-full border-t-2 border-dashed border-blue-500 flex items-center justify-center">
                                  <span className="bg-white px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-blue-600 border border-blue-200">
                                    15m away
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-bold text-slate-800">{currentDisplayTicket.room_number || 'Lab 102'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Rating Section */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block">Rate the Service</span>
                      <div className="flex items-center space-x-1 text-amber-400 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              setRatingVal(star);
                              setRatingSubmitted(true);
                            }}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setRatingSubmitted(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {ratingSubmitted ? 'Rated ★' : 'Add Review'}
                    </button>
                  </div>
                </div>

                {/* COLUMN 3: CAMPUSGPT 24x7 AI ASSISTANT */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-800 text-sm">CampusGPT</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            ● Online
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Your 24/7 Campus Assistant</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveNav('CampusGPT')}
                      className="text-xs text-purple-600 font-bold hover:underline"
                    >
                      Expand
                    </button>
                  </div>

                  {/* Sub-Tabs */}
                  <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                    {['Ask', 'Search', 'Academic', 'Notices'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setChatCategory(tab)}
                        className={`flex-1 py-1 rounded-lg transition-all ${
                          chatCategory === tab ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                      <button
                        key={prompt.label}
                        onClick={() => handleAskCampusGpt(prompt.query)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600 transition-colors flex items-center space-x-1"
                      >
                        <span>{prompt.icon}</span>
                        <span>{prompt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Live Chat Message Area */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-1 text-xs">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px] mr-2 shrink-0">
                            🤖
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 space-y-2 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                              : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="leading-relaxed text-xs">{msg.text}</p>

                          {msg.table && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white text-[11px] mt-2">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                  <tr>
                                    <th className="p-2">Event</th>
                                    <th className="p-2">Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {msg.table.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      <td className="p-2 font-medium">{row.event}</td>
                                      <td className="p-2 font-mono text-blue-600 font-bold">{row.date}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {msg.circular_pdf && (
                            <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-[9px]">
                                  PDF
                                </div>
                                <div>
                                  <div className="font-bold text-[11px] text-slate-800">{msg.circular_pdf}</div>
                                  <div className="text-[9px] text-slate-400 font-mono">{msg.pdf_size}</div>
                                </div>
                              </div>
                              <button className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div
                            className={`text-[9px] text-right font-mono ${
                              msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {msg.timestamp || '10:28 AM'}
                          </div>
                        </div>
                      </div>
                    ))}

                    {gptLoading && (
                      <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                        <span>Querying campus gazette vector database...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                    <input
                      type="text"
                      value={gptQuery}
                      onChange={(e) => setGptQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskCampusGpt()}
                      placeholder="Ask anything about campus..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <button
                      onClick={() => handleAskCampusGpt()}
                      disabled={gptLoading || !gptQuery.trim()}
                      className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: RAISE COMPLAINT (Dedicated View) */}
          {activeNav === 'Raise Complaint' && (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-800">Lodge Facility Grievance</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Submit any classroom, lab, electrical or housekeeping issues. Direct dispatch to facility technician.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Category of Issue</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Building Block</label>
                  <select
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="Block-B">Block-B (Academic)</option>
                    <option value="Block-A">Block-A (Labs)</option>
                    <option value="Block-C">Block-C (Workshops)</option>
                    <option value="Central Library">Central Library</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Floor</label>
                  <select
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value={1}>Floor 1</option>
                    <option value={2}>Floor 2</option>
                    <option value={3}>Floor 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Room / Location</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Lab 102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain exactly what is malfunctioning..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              <button
                onClick={handleSubmitGrievance}
                disabled={submittingComplaint}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submittingComplaint ? 'Dispatching Workorder...' : 'Submit & Track Live'}</span>
              </button>
            </div>
          )}

          {/* VIEW 3: MY TICKETS (Full List & Real Records) */}
          {activeNav === 'My Tickets' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800">My Maintenance &amp; Safety Tickets</h2>
                  <p className="text-xs text-slate-400">All registered complaints lodged by your student/faculty account</p>
                </div>
                <button
                  onClick={loadMyTickets}
                  disabled={loadingTickets}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                  <span>Refresh Tickets</span>
                </button>
              </div>

              <div className="space-y-3">
                {(myTickets.length > 0 ? myTickets : [defaultTicket]).map((t, idx) => {
                  const isSelected = activeTicket?.id === t.id || (!activeTicket && idx === 0);
                  return (
                    <div
                      key={t.id || idx}
                      onClick={() => setActiveTicket(t)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold">
                          #{t.complaint_code || t.ticket_id || t.id || '1042'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{t.title || `${t.category} Issue in ${t.room_number}`}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.description || 'Facility maintenance required.'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {t.block_name} • {t.room_number} • Raised: {t.created_at || 'Today'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end md:self-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          ● {t.status || 'IN_PROGRESS'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTicket(t);
                            setActiveNav('Dashboard');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                        >
                          Track Live
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: CAMPUS MAP */}
          {activeNav === 'Campus Map' && (
            <div className="bg-white dark:bg-[#0a0f1e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">Campus Digital Twin Map</h2>
                  <p className="text-xs text-slate-400">Interactive 2D architectural blueprint and live campus navigation</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setPortalMapMode('2D')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        portalMapMode === '2D'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      2D Blueprint
                    </button>
                    <button
                      onClick={() => setPortalMapMode('MAP')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        portalMapMode === 'MAP'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Satellite GIS
                    </button>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold pl-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Live Telemetry</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                {portalMapMode === '2D' ? (
                  <SpatialDigitalTwin2D height="560px" activeRole="STUDENT" />
                ) : (
                  <CampusMap height="560px" />
                )}
              </div>
            </div>
          )}

          {/* VIEW 5: TIMETABLE */}
          {activeNav === 'Timetable' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Class &amp; Lecture Timetable</h2>
                <p className="text-xs text-slate-400">Weekly schedule for Odd Semester 2026-27 (Section CS-A)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  {
                    day: 'Monday',
                    classes: [
                      { time: '09:00 - 10:00 AM', subject: 'Operating Systems', room: 'Block-B Room 204', faculty: 'Dr. V. Sharma' },
                      { time: '10:15 - 11:15 AM', subject: 'Database Management', room: 'Block-A Lab 102', faculty: 'Prof. K. Verma' },
                      { time: '01:30 - 03:30 PM', subject: 'Compiler Design Lab', room: 'Block-A Lab 201', faculty: 'Er. R. Rao' },
                    ],
                  },
                  {
                    day: 'Tuesday',
                    classes: [
                      { time: '09:00 - 10:00 AM', subject: 'Computer Networks', room: 'Block-B Room 204', faculty: 'Prof. N. Gupta' },
                      { time: '11:30 - 12:30 PM', subject: 'Design & Analysis of Algo', room: 'Block-B Room 201', faculty: 'Dr. P. Sen' },
                      { time: '02:00 - 03:00 PM', subject: 'Cyber Law & Ethics', room: 'Block-B Room 204', faculty: 'Adv. S. Nair' },
                    ],
                  },
                  {
                    day: 'Wednesday',
                    classes: [
                      { time: '09:00 - 11:00 AM', subject: 'IoT & Digital Twin Workshop', room: 'Block-C Lab 301', faculty: 'Dr. A. Roy' },
                      { time: '11:30 - 12:30 PM', subject: 'Software Engineering', room: 'Block-B Room 204', faculty: 'Dr. V. Sharma' },
                      { time: '01:30 - 02:30 PM', subject: 'Technical Communication', room: 'Seminar Hall', faculty: 'Prof. M. Joshi' },
                    ],
                  },
                  {
                    day: 'Thursday',
                    classes: [
                      { time: '09:00 - 10:00 AM', subject: 'Operating Systems', room: 'Block-B Room 204', faculty: 'Dr. V. Sharma' },
                      { time: '10:15 - 11:15 AM', subject: 'Database Management', room: 'Block-B Room 204', faculty: 'Prof. K. Verma' },
                      { time: '01:30 - 03:30 PM', subject: 'Networks Simulator Lab', room: 'Block-A Lab 102', faculty: 'Prof. N. Gupta' },
                    ],
                  },
                  {
                    day: 'Friday',
                    classes: [
                      { time: '09:00 - 10:00 AM', subject: 'Design & Analysis of Algo', room: 'Block-B Room 201', faculty: 'Dr. P. Sen' },
                      { time: '10:15 - 11:15 AM', subject: 'Computer Networks', room: 'Block-B Room 204', faculty: 'Prof. N. Gupta' },
                      { time: '02:00 - 04:00 PM', subject: 'Major Project Mentorship', room: 'Faculty Chamber', faculty: 'Faculty Guides' },
                    ],
                  },
                ].map((col) => (
                  <div key={col.day} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
                    <div className="font-bold text-slate-800 text-xs pb-1 border-b border-slate-200">{col.day}</div>
                    {col.classes.map((cls, cIdx) => (
                      <div key={cIdx} className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-xs space-y-1">
                        <div className="font-bold text-slate-800 text-xs">{cls.subject}</div>
                        <div className="text-[10px] text-blue-600 font-mono font-medium">{cls.time}</div>
                        <div className="text-[10px] text-slate-500">{cls.room}</div>
                        <div className="text-[9px] text-slate-400">{cls.faculty}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 6: ACADEMIC CALENDAR & GRADES */}
          {activeNav === 'Academic' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Academic Portal &amp; Semester Gazette</h2>
                <p className="text-xs text-slate-400">Curriculum progress, attendance status, and mid-sem schedule</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <div className="text-xs font-bold text-blue-900">Current Semester</div>
                  <div className="text-2xl font-black text-blue-700">Odd 2026-27</div>
                  <div className="text-[11px] text-blue-600">B.Tech Computer Science &amp; Eng.</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="text-xs font-bold text-emerald-900">Overall Attendance</div>
                  <div className="text-2xl font-black text-emerald-700">84.2%</div>
                  <div className="text-[11px] text-emerald-600">Above mandatory 75% cutoff threshold</div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                  <div className="text-xs font-bold text-purple-900">Cumulative GPA</div>
                  <div className="text-2xl font-black text-purple-700">8.92 / 10</div>
                  <div className="text-[11px] text-purple-600">Class Rank: 4th (Top 5%)</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Upcoming Exam Schedule</h3>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-3">Course Code</th>
                        <th className="p-3">Course Title</th>
                        <th className="p-3">Exam Date</th>
                        <th className="p-3">Venue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-600">CS-501</td>
                        <td className="p-3 font-medium">Operating Systems &amp; Concurrency</td>
                        <td className="p-3">25 Oct 2026, 10:00 AM</td>
                        <td className="p-3">Block-B Hall 1</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-600">CS-502</td>
                        <td className="p-3 font-medium">Database Systems &amp; Query Optim.</td>
                        <td className="p-3">28 Oct 2026, 10:00 AM</td>
                        <td className="p-3">Block-B Hall 1</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-600">CS-503</td>
                        <td className="p-3 font-medium">Design &amp; Analysis of Algorithms</td>
                        <td className="p-3">31 Oct 2026, 10:00 AM</td>
                        <td className="p-3">Block-B Hall 2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 7: NOTICES & CIRCULARS */}
          {activeNav === 'Notices' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Official Campus Gazette &amp; Notices</h2>
                <p className="text-xs text-slate-400">Authenticated circulars issued by Dean Academic &amp; Proctorial Board</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Mid-Term Examination Datesheet & Guidelines (Odd Sem 2026)',
                    category: 'EXAMINATION',
                    date: '12 Oct 2026',
                    id: 'CIRC-2026-104',
                    size: '2.4 MB PDF',
                  },
                  {
                    title: 'Advisory on Night-Out Passes & Hostel Gate Curfew 10:00 PM',
                    category: 'HOSTEL_ADMIN',
                    date: '10 Oct 2026',
                    id: 'CIRC-2026-101',
                    size: '1.1 MB PDF',
                  },
                  {
                    title: 'Annual HackCampus 2026 - Registrations & Prize Pool Announcement',
                    category: 'TECH_FEST',
                    date: '08 Oct 2026',
                    id: 'CIRC-2026-098',
                    size: '3.6 MB PDF',
                  },
                ].map((not, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">
                          {not.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{not.id}</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">{not.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Published on {not.date}</div>
                    </div>
                    <button className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs">
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: HOSTEL MANAGEMENT */}
          {activeNav === 'Hostel' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Hostel Resident Portal</h2>
                <p className="text-xs text-slate-400">Curfew monitoring, warden helpline, and night-out pass request</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Gate Curfew Timing</span>
                    <Clock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="text-2xl font-black text-amber-800">10:00 PM Sharp</div>
                  <p className="text-xs text-amber-700">
                    Hostel gates automatically close with RFID check. Apply for e-Pass 4 hours in advance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Allotted Accommodation</div>
                  <div className="text-lg font-bold text-slate-800">Boys Hostel-C • Room 304</div>
                  <p className="text-xs text-slate-500">Warden: Dr. R. S. Rathore (Ph: +91 98765 00301)</p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-xs text-slate-800">Apply for Night-Out e-Pass</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Reason (e.g. Family Function / Medical)"
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                  />
                  <input
                    type="date"
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                  />
                </div>
                <button
                  onClick={() => alert('e-Pass application submitted to Chief Warden for biometric approval!')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Request Night-Out Pass
                </button>
              </div>
            </div>
          )}

          {/* VIEW 9: RESOURCES & REPOSITORY */}
          {activeNav === 'Resources' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Digital Library &amp; Academic Repository</h2>
                <p className="text-xs text-slate-400">Download syllabus handbooks, lab manuals, and previous year exam questions</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { title: 'Operating Systems Lab Manual 2026', type: 'PDF', size: '4.1 MB' },
                  { title: 'Database Schema & SQL Exercises', type: 'DOCX', size: '1.8 MB' },
                  { title: 'Computer Networks Question Bank (2020-2025)', type: 'PDF', size: '5.2 MB' },
                  { title: 'Digital Twin Architecture Whitepaper', type: 'PDF', size: '3.4 MB' },
                  { title: 'Full B.Tech CSE Curriculum Scheme', type: 'PDF', size: '2.1 MB' },
                  { title: 'Placement Aptitude & Coding Guide', type: 'PDF', size: '6.7 MB' },
                ].map((res, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{res.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{res.size} • {res.type}</div>
                    </div>
                    <button className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 10: CAMPUS EVENTS */}
          {activeNav === 'Events' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">Campus Events &amp; Hackathons</h2>
                <p className="text-xs text-slate-400">Upcoming tech summits, cultural fests, and guest lectures</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-bold">
                    Hackathon
                  </span>
                  <div className="text-base font-black text-slate-800">HackCampus 2026 (36 Hours)</div>
                  <p className="text-xs text-slate-600">
                    Theme: Smart Cities, AI Twins &amp; Clean Energy. Prize pool ₹1,50,000.
                  </p>
                  <div className="text-[10px] text-blue-700 font-mono">Date: 12-14 Nov 2026 • Central Auditorium</div>
                  <button
                    onClick={() => alert('Successfully registered for HackCampus 2026!')}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Register Team
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold">
                    Guest Lecture
                  </span>
                  <div className="text-base font-black text-slate-800">AI in Infrastructure Automation</div>
                  <p className="text-xs text-slate-600">
                    Keynote by Dr. A. Ramanujan (Chief AI Architect at TechCorp Labs).
                  </p>
                  <div className="text-[10px] text-purple-700 font-mono">Date: 28 Oct 2026, 03:00 PM • Seminar Hall</div>
                  <button
                    onClick={() => alert('RSVP confirmed! Added to your campus timetable.')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Reserve Seat (Free)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 11: FULL CAMPUSGPT */}
          {activeNav === 'CampusGPT' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 max-w-4xl mx-auto flex flex-col h-[700px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">CampusGPT AI Assistant (Full Terminal)</h2>
                    <p className="text-[10px] text-slate-400">RAG Vector Search across University Circulars, Timetables &amp; Ordinances</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ● 24/7 AI Online
                </span>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 space-y-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.table && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white text-[11px] mt-2">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2">Event</th>
                                <th className="p-2">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {msg.table.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="p-2 font-medium">{row.event}</td>
                                  <td className="p-2 font-mono text-blue-600 font-bold">{row.date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className={`text-[9px] text-right font-mono ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {msg.timestamp || 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleAskCampusGpt(p.query)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium flex items-center space-x-1.5"
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={gptQuery}
                  onChange={(e) => setGptQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCampusGpt()}
                  placeholder="Ask any question about university policies, rules, hostels..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  onClick={() => handleAskCampusGpt()}
                  disabled={gptLoading || !gptQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* EMERGENCY HELP & CAMPUS DIRECTORY MODAL */}
      {/* =================================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Campus Emergency Directory</h3>
                  <p className="text-[11px] text-slate-400">24/7 Helpline &amp; Department Contacts</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Security Control Room (SOC)', num: '+91 11 2345 6789', note: '24/7 Gate & SOS Dispatch', red: true },
                { name: 'Campus Medical & Ambulance', num: '+91 98765 00108', note: 'Doctor on Campus Block-A', red: true },
                { name: 'Chief Proctor Office', num: '+91 11 2345 6701', note: 'Discipline & Hostel Inquiries' },
                { name: 'Facility & Electrical Helpline', num: '+91 98765 00201', note: 'Power breakdown / AC issue' },
                { name: 'Hostel Resident Warden', num: '+91 98765 00301', note: 'Hostel A & B Wardens Desk' },
                { name: 'IT Infrastructure & Wi-Fi Desk', num: '+91 11 2345 6799', note: 'Portal / Credential support' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    item.red ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.note}</div>
                  </div>
                  <a
                    href={`tel:${item.num.replace(/[^0-9+]/g, '')}`}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 font-mono font-bold text-xs hover:bg-blue-50 flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{item.num}</span>
                  </a>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Close Directory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndUserDashboard;
