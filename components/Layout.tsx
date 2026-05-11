
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Trello, 
  Users, 
  Map, 
  Hotel as HotelIcon, 
  Car, 
  Image as ImageIcon,
  Sparkles,
  Settings,
  LogOut,
  Mountain,
  FileText,
  Compass,
  Bell,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Menu,
  MessageSquare,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  Zap,
  Briefcase,
  ListChecks,
  Activity as ActivityIcon,
  PlaneLanding,
  BookOpen
} from 'lucide-react';
import { Lead, LeadStage, UserRole, TeamMember, Trip, TripStatus } from '../types';
import { MOCK_LEADS, DEFAULT_PERSONAS, BRAND_CONFIG, MOCK_TRIPS } from '../constants';
import { sendSimulatedMessage, DEFAULT_TEMPLATES, saveMessageLog } from '../services/messagingService';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const SidebarItem = ({ icon: Icon, label, path, active, badge, isCollapsed }: { icon: any, label: string, path: string, active: boolean, roleColor: string, badge?: number, isCollapsed?: boolean }) => (
  <Link 
    to={path} 
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
      active ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
    title={isCollapsed ? label : ''}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : 'text-slate-400'} />
      {!isCollapsed && <span className={`text-[14px] tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>}
    </div>
    {!isCollapsed && badge !== undefined && badge > 0 && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-[#007AFF] text-white'}`}>{badge}</span>
    )}
  </Link>
);

const SidebarHeader = ({ label, isCollapsed }: { label: string, isCollapsed?: boolean }) => (
  isCollapsed ? (
    <div className="h-px bg-slate-800/50 my-6 mx-2" />
  ) : (
    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4 mt-8 ml-4 opacity-60">{label}</p>
  )
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user: authUser, userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return safeLocalStorage.getItem('et_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      safeLocalStorage.setItem('et_sidebar_collapsed', newState.toString());
      return newState;
    });
  };
  const [currentUser, setCurrentUser] = useState<TeamMember>(() => {
    if (userProfile) return userProfile;
    const savedMembers = safeLocalStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    let members: TeamMember[] = DEFAULT_PERSONAS;
    try {
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) members = parsed;
      }
    } catch (e) {
      console.error('Failed to parse members for initial state:', e);
    }
    const activeId = safeLocalStorage.getItem('et_active_member_id');
    return members.find(m => m.id === activeId) || members[0] || DEFAULT_PERSONAS[0];
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const savedMembers = safeLocalStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    try {
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse members for initial state:', e);
    }
    return DEFAULT_PERSONAS;
  });
  const [agencyConfig, setAgencyConfig] = useState(() => {
    const savedConfig = safeLocalStorage.getItem(STORAGE_KEYS.BRAND_CONFIG);
    try {
      if (savedConfig) return JSON.parse(savedConfig);
    } catch (e) {
      console.error('Failed to parse brand config for initial state:', e);
    }
    return BRAND_CONFIG;
  });
  const [alerts] = useState<{ id: string, title: string, desc: string, type: 'danger' | 'warning' | 'info' | 'success', leadId: string }[]>([]);
  const [ongoingCount, setOngoingCount] = useState(() => {
    const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
    let tripsList: Trip[] = MOCK_TRIPS;
    try {
      if (savedTrips) {
        const parsed = JSON.parse(savedTrips);
        if (Array.isArray(parsed)) tripsList = parsed;
      }
    } catch (e) {
      console.error('Failed to parse trips for initial state:', e);
    }
    const todayStr = new Date().toISOString().split('T')[0];
    return tripsList.filter(t => t.status === TripStatus.BOOKED && t.startDate <= todayStr && t.endDate >= todayStr).length;
  });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile && userProfile.id !== currentUser.id) {
      Promise.resolve().then(() => setCurrentUser(userProfile));
    }
  }, [userProfile, currentUser.id]);

  useEffect(() => {
    const refreshData = () => {
      const savedMembers = safeLocalStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      let members: TeamMember[] = DEFAULT_PERSONAS;
      try {
        if (savedMembers) {
          const parsed = JSON.parse(savedMembers);
          if (Array.isArray(parsed)) members = parsed;
        }
      } catch (e) {
        console.error('Failed to parse members:', e);
      }
      setTeamMembers(members);

      if (!userProfile) {
        const activeMemberId = safeLocalStorage.getItem('et_active_member_id');
        const found = members.find(m => m.id === activeMemberId);
        
        if (found) {
          setCurrentUser(found);
        } else {
          const firstAvailable = members.length > 0 ? members[0] : DEFAULT_PERSONAS[0];
          setCurrentUser(firstAvailable);
          safeLocalStorage.setItem('et_active_member_id', firstAvailable.id);
        }
      }

      const savedConfig = safeLocalStorage.getItem(STORAGE_KEYS.BRAND_CONFIG);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setAgencyConfig(parsed);
        } catch (e) {
          console.error('Failed to parse brand config:', e);
        }
      }

      const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      let trips: Trip[] = MOCK_TRIPS;
      try {
        if (savedTrips) {
          const parsed = JSON.parse(savedTrips);
          if (Array.isArray(parsed)) trips = parsed;
        }
      } catch (e) {
        console.error('Failed to parse trips in layout:', e);
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const ongoing = trips.filter(t => t.status === TripStatus.BOOKED && t.startDate <= todayStr && t.endDate >= todayStr);
      setOngoingCount(ongoing.length);
    };

    window.addEventListener('storage', refreshData);
    window.addEventListener('user-profile-updated', refreshData);
    window.addEventListener('et_settings_updated', refreshData);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('user-profile-updated', refreshData);
      window.removeEventListener('et_settings_updated', refreshData);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userProfile]);

  const switchPersona = (member: TeamMember) => {
    safeLocalStorage.setItem('et_active_member_id', member.id);
    window.dispatchEvent(new Event('user-profile-updated'));
    setShowProfileMenu(false);
  };


  const isAllowed = (path: string) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    const salesPaths = ['/', '/pipeline', '/leads', '/trips', '/templates'];
    const opsPaths = ['/trips', '/ongoing', '/hotels', '/vehicles', '/activities', '/add-ons', '/master-terms', '/database/variations', '/database/assets'];
    if (currentUser.role === UserRole.SALES) return salesPaths.includes(path) || path.startsWith('/leads') || path.startsWith('/trips');
    if (currentUser.role === UserRole.OPERATIONS) return opsPaths.includes(path) || path.startsWith('/trips') || path.startsWith('/ongoing');
    return false;
  };

  const agencyName = agencyConfig.name.toUpperCase().split(' ');
  const firstWord = agencyName[0] || 'TRAVEL';
  const remainingName = agencyName.slice(1).join(' ') || (agencyConfig.name === 'Travel Bliss Kashmir' ? 'BLISS KASHMIR' : '');

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} flex flex-col p-6 bg-[#0a0a0b] border-r border-[#1a1a1b] transition-all duration-500 ease-in-out relative group/sidebar`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} mb-8 mt-2 transition-all`}>
          <div className={`${currentUser.color} p-2 rounded-xl shadow-xl transition-all duration-500 overflow-hidden flex items-center justify-center w-11 h-11 shrink-0`}>
            {agencyConfig.logo ? (
              <img src={agencyConfig.logo} alt="Agency" className="w-full h-full object-contain filter invert brightness-0 p-0.5" />
            ) : (
              <Mountain className="text-white" size={24} />
            )}
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-white font-black text-lg tracking-tighter leading-none truncate">{firstWord}</h1>
              <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] truncate">{remainingName}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
          {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SALES) && (
            <>
              <SidebarHeader label="Revenue & Sales" isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={location.pathname === '/'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Trello} label="Sales Pipeline" path="/pipeline" active={location.pathname === '/pipeline'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Users} label="Lead Manager" path="/leads" active={location.pathname.startsWith('/leads') && location.pathname !== '/leads/new'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
            </>
          )}
          
          <SidebarHeader label="Operations" isCollapsed={isSidebarCollapsed} />
          <SidebarItem icon={ActivityIcon} label="Ongoing Trips" path="/ongoing" active={location.pathname === '/ongoing'} roleColor={currentUser.color} badge={ongoingCount} isCollapsed={isSidebarCollapsed} />
          <SidebarItem icon={Map} label="All Itineraries" path="/trips" active={location.pathname === '/trips' || (location.pathname.startsWith('/trips/') && !location.pathname.includes('print'))} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
          {isAllowed('/templates') && <SidebarItem icon={FileText} label="Templates" path="/templates" active={location.pathname.startsWith('/templates')} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />}
          
          <SidebarHeader label="Finance & Accounts" isCollapsed={isSidebarCollapsed} />
          <SidebarItem icon={BookOpen} label="Day Book" path="/daybook" active={location.pathname === '/daybook'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />

          {isAllowed('/hotels') && (
            <>
              <SidebarHeader label="Master Database" isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={HotelIcon} label="Hotels" path="/hotels" active={location.pathname === '/hotels'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Car} label="Vehicle Fleet" path="/vehicles" active={location.pathname === '/vehicles'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Compass} label="Activities" path="/activities" active={location.pathname === '/activities'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Sparkles} label="Add-ons" path="/add-ons" active={location.pathname === '/add-ons'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={ImageIcon} label="Destination Assets" path="/database/assets" active={location.pathname === '/database/assets'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Zap} label="Day Variations" path="/database/variations" active={location.pathname === '/database/variations'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={ListChecks} label="Master Terms" path="/master-terms" active={location.pathname === '/master-terms'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
            </>
          )}

          {currentUser.role === UserRole.ADMIN && (
            <>
              <SidebarHeader label="Administrator" isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={ShieldCheck} label="User Roles & Access" path="/admin/users" active={location.pathname === '/admin/users'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
            </>
          )}
          
          {currentUser.role === UserRole.ADMIN && (
            <>
              <SidebarHeader label="System" isCollapsed={isSidebarCollapsed} />
              <SidebarItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} roleColor={currentUser.color} isCollapsed={isSidebarCollapsed} />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-white/5 pt-6">
          <button 
            onClick={signOut}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3 text-slate-500 hover:text-white transition-all w-full group rounded-2xl hover:bg-white/5`}
            title={isSidebarCollapsed ? 'Sign Out' : ''}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F5F5F7]">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[100]">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 bg-slate-100/50 hover:bg-slate-100 rounded-[14px] text-slate-500 hover:text-[#007AFF] transition-all"
              title={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
              {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <h2 className="text-slate-900 font-bold text-xl tracking-tighter whitespace-nowrap overflow-hidden">
              {location.pathname === '/' ? 'Business Intelligence' : 
               location.pathname.startsWith('/daybook') ? 'Internal Ledger' :
               location.pathname.startsWith('/ongoing') ? 'Valley Live Ops' :
               location.pathname.startsWith('/pipeline') ? 'Sales Pipeline' :
               location.pathname.startsWith('/leads') ? 'Client Relationship' :
               location.pathname.startsWith('/trips') ? 'Itinerary Control' :
               location.pathname.startsWith('/profile') ? 'My Workspace' :
               'Operational Control'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
            >
              <Bell size={20} className="text-slate-400 group-hover:text-blue-600" />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black">
                  {alerts.length}
                </span>
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-4 p-1 pr-3 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-200"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden transition-transform group-active:scale-90">
                  <img src={authUser?.photoURL || currentUser.avatar} alt={authUser?.displayName || currentUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-black text-slate-900 leading-none flex items-center gap-1">
                    {authUser?.displayName || currentUser.name}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{authUser?.email || currentUser.title}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[120] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-3">
                    <Link 
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-slate-50"
                    >
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                        <UserIcon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-700">My Profile</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Settings</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
