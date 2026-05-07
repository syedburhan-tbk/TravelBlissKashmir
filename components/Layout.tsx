
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

const SidebarItem = ({ icon: Icon, label, path, active, roleColor, badge }: { icon: any, label: string, path: string, active: boolean, roleColor: string, badge?: number }) => (
  <Link 
    to={path} 
    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all ${
      active ? `${roleColor} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span className="font-bold text-[13px]">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>{badge}</span>
    )}
  </Link>
);

const SidebarHeader = ({ label }: { label: string }) => (
  <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3 mt-6 ml-4">{label}</p>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user: authUser, userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<TeamMember>(userProfile || DEFAULT_PERSONAS[0]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_PERSONAS);
  const [agencyConfig, setAgencyConfig] = useState(BRAND_CONFIG);
  const [alerts, setAlerts] = useState<{ id: string, title: string, desc: string, type: 'danger' | 'warning' | 'info' | 'success', leadId: string }[]>([]);
  const [ongoingCount, setOngoingCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      setCurrentUser(userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    const refreshData = () => {
      const savedMembers = localStorage.getItem('et_team_members');
      const members: TeamMember[] = savedMembers ? JSON.parse(savedMembers) : DEFAULT_PERSONAS;
      setTeamMembers(members);

      if (!userProfile) {
        const activeMemberId = localStorage.getItem('et_active_member_id');
        const found = members.find(m => m.id === activeMemberId);
        
        if (found) {
          setCurrentUser(found);
        } else {
          const firstAvailable = members.length > 0 ? members[0] : DEFAULT_PERSONAS[0];
          setCurrentUser(firstAvailable);
          localStorage.setItem('et_active_member_id', firstAvailable.id);
        }
      }

      const savedConfig = localStorage.getItem('et_brand_config');
      if (savedConfig) setAgencyConfig(JSON.parse(savedConfig));

      // Calculate ongoing trips count
      const savedTrips = localStorage.getItem('et_trips');
      const trips: Trip[] = savedTrips ? JSON.parse(savedTrips) : MOCK_TRIPS;
      const todayStr = new Date().toISOString().split('T')[0];
      const ongoing = trips.filter(t => t.status === TripStatus.BOOKED && t.startDate <= todayStr && t.endDate >= todayStr);
      setOngoingCount(ongoing.length);
    };

    refreshData();
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
  }, []);

  const switchPersona = (member: TeamMember) => {
    localStorage.setItem('et_active_member_id', member.id);
    window.dispatchEvent(new Event('user-profile-updated'));
    setShowProfileMenu(false);
  };

  const isAllowed = (path: string) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    const salesPaths = ['/', '/pipeline', '/leads', '/trips', '/templates'];
    const opsPaths = ['/trips', '/ongoing', '/hotels', '/vehicles', '/activities', '/add-ons', '/master-terms'];
    if (currentUser.role === UserRole.SALES) return salesPaths.includes(path) || path.startsWith('/leads') || path.startsWith('/trips');
    if (currentUser.role === UserRole.OPERATIONS) return opsPaths.includes(path) || path.startsWith('/trips') || path.startsWith('/ongoing');
    return false;
  };

  const agencyName = agencyConfig.name.toUpperCase().split(' ');
  const firstWord = agencyName[0] || 'TRAVEL';
  const remainingName = agencyName.slice(1).join(' ') || (agencyConfig.name === 'Travel Bliss Kashmir' ? 'BLISS KASHMIR' : '');

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <aside className="w-64 bg-slate-950 flex flex-col p-6 border-r border-slate-900 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${currentUser.color} p-2.5 rounded-xl shadow-xl transition-colors duration-500 overflow-hidden flex items-center justify-center min-w-[44px] min-h-[44px]`}>
            {agencyConfig.logo ? (
              <img src={agencyConfig.logo} alt="Agency" className="w-full h-full object-contain filter invert brightness-0" />
            ) : (
              <Mountain className="text-white" size={24} />
            )}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-white font-black text-lg tracking-tighter leading-none truncate">{firstWord}</h1>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] truncate">{remainingName}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SALES) && (
            <>
              <SidebarHeader label="Revenue & Sales" />
              <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={location.pathname === '/'} roleColor={currentUser.color} />
              <SidebarItem icon={Trello} label="Sales Pipeline" path="/pipeline" active={location.pathname === '/pipeline'} roleColor={currentUser.color} />
              <SidebarItem icon={Users} label="Lead Manager" path="/leads" active={location.pathname.startsWith('/leads') && location.pathname !== '/leads/new'} roleColor={currentUser.color} />
            </>
          )}
          
          <SidebarHeader label="Operations" />
          <SidebarItem icon={ActivityIcon} label="Ongoing Trips" path="/ongoing" active={location.pathname === '/ongoing'} roleColor={currentUser.color} badge={ongoingCount} />
          <SidebarItem icon={Map} label="All Itineraries" path="/trips" active={location.pathname === '/trips' || (location.pathname.startsWith('/trips/') && !location.pathname.includes('print'))} roleColor={currentUser.color} />
          {isAllowed('/templates') && <SidebarItem icon={FileText} label="Templates" path="/templates" active={location.pathname.startsWith('/templates')} roleColor={currentUser.color} />}
          
          <SidebarHeader label="Finance & Accounts" />
          <SidebarItem icon={BookOpen} label="Day Book" path="/daybook" active={location.pathname === '/daybook'} roleColor={currentUser.color} />

          {isAllowed('/hotels') && (
            <>
              <SidebarHeader label="Master Database" />
              <SidebarItem icon={HotelIcon} label="Hotels" path="/hotels" active={location.pathname === '/hotels'} roleColor={currentUser.color} />
              <SidebarItem icon={Car} label="Vehicle Fleet" path="/vehicles" active={location.pathname === '/vehicles'} roleColor={currentUser.color} />
              <SidebarItem icon={Compass} label="Activities" path="/activities" active={location.pathname === '/activities'} roleColor={currentUser.color} />
              <SidebarItem icon={Sparkles} label="Add-ons" path="/add-ons" active={location.pathname === '/add-ons'} roleColor={currentUser.color} />
              <SidebarItem icon={ListChecks} label="Master Terms" path="/master-terms" active={location.pathname === '/master-terms'} roleColor={currentUser.color} />
            </>
          )}
          
          {currentUser.role === UserRole.ADMIN && (
            <>
              <SidebarHeader label="System" />
              <SidebarItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} roleColor={currentUser.color} />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-900 pt-6">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors w-full group">
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-900 font-black text-xl tracking-tight uppercase">
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
                        <Users size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-700">Team Workspace</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage members</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
