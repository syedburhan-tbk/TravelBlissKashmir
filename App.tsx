
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import LeadList from './pages/LeadList';
import LeadProfile from './pages/LeadProfile';
import NewLead from './pages/NewLead';
import TripList from './pages/TripList';
import TripBuilder from './pages/TripBuilder';
import Hotels from './pages/Hotels';
import Vehicles from './pages/Vehicles';
import Activities from './pages/Activities';
import AddOns from './pages/AddOns';
import Templates from './pages/Templates';
import TemplateBuilder from './pages/TemplateBuilder';
import VariationsDatabase from './pages/VariationsDatabase';
import DestinationAssets from './pages/DestinationAssets';
import Settings from './pages/Settings';
import NewTrip from './pages/NewTrip';
import ClientItinerary from './pages/ClientItinerary';
import ProfileSettings from './pages/ProfileSettings';
import MasterTerms from './pages/MasterTerms';
import OngoingTrips from './pages/OngoingTrips';
import DayBook from './pages/DayBook';
import UserManagement from './pages/Admin/UserManagement';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/quotation/:id" element={<ClientItinerary />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/admin/users" element={<Layout><UserManagement /></Layout>} />
            <Route path="/pipeline" element={<Layout><Pipeline /></Layout>} />
            <Route path="/leads" element={<Layout><LeadList /></Layout>} />
            <Route path="/leads/new" element={<Layout><NewLead /></Layout>} />
            <Route path="/leads/:id" element={<Layout><LeadProfile /></Layout>} />
            
            <Route path="/trips" element={<Layout><TripList /></Layout>} />
            <Route path="/trips/new" element={<Layout><NewTrip /></Layout>} />
            <Route path="/trips/:id" element={<Layout><TripBuilder /></Layout>} />
            <Route path="/ongoing" element={<Layout><OngoingTrips /></Layout>} />
            
            <Route path="/hotels" element={<Layout><Hotels /></Layout>} />
            <Route path="/vehicles" element={<Layout><Vehicles /></Layout>} />
            <Route path="/activities" element={<Layout><Activities /></Layout>} />
            <Route path="/add-ons" element={<Layout><AddOns /></Layout>} />
            <Route path="/master-terms" element={<Layout><MasterTerms /></Layout>} />
            <Route path="/database/variations" element={<Layout><VariationsDatabase /></Layout>} />
            <Route path="/database/assets" element={<Layout><DestinationAssets /></Layout>} />
            
            <Route path="/templates" element={<Layout><Templates /></Layout>} />
            <Route path="/templates/new" element={<Layout><TemplateBuilder /></Layout>} />
            <Route path="/templates/:id/edit" element={<Layout><TemplateBuilder /></Layout>} />

            <Route path="/daybook" element={<Layout><DayBook /></Layout>} />
            
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/profile" element={<Layout><ProfileSettings /></Layout>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;
