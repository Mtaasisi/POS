import React, { useState } from 'react';
import { useDevices } from '../context/DevicesContext';
import { Rocket } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { saveActionOffline } from '../lib/offlineSync';
import { User } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface AssignTechnicianFormProps {
  deviceId: string;
  currentTechId?: string;
  currentUser: User;
}

// Remove mockTechnicians array

const AssignTechnicianForm: React.FC<AssignTechnicianFormProps> = ({ deviceId, currentTechId, currentUser }) => {
  const [selectedTechId, setSelectedTechId] = useState(currentTechId || '');
  const [remark, setRemark] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const { assignToTechnician, updateDeviceStatus } = useDevices();

  React.useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, name, email')
        .eq('role', 'technician');
      if (!error && data) {
        setTechnicians(data);
      }
    };
    fetchTechnicians();
  }, []);
  
  const handleAssign = async () => {
    if (selectedTechId) {
      if (navigator.onLine) {
        await assignToTechnician(deviceId, selectedTechId, '');
      } else {
        await saveActionOffline({ type: 'assignTechnician', payload: { deviceId, selectedTechId } });
        alert('You are offline. Technician assignment will be synced when you are back online.');
      }
    }
  };
  
  const handleMarkFailed = async () => {
    if (window.confirm("Are you sure you want to mark this device as failed to repair? This action cannot be undone.")) {
      try {
        if (navigator.onLine) {
          // First add a remark about the failure
          if (remark.trim()) {
            await supabase
              .from('device_remarks')
              .insert({
                id: `remark-${Date.now()}`,
                device_id: deviceId,
                content: `FAILED TO REPAIR: ${remark}`,
                created_by: currentUser.id,
                created_at: new Date().toISOString()
              });
          } else {
            // Add a default remark if none provided
            await supabase
              .from('device_remarks')
              .insert({
                id: `remark-${Date.now()}`,
                device_id: deviceId,
                content: 'FAILED TO REPAIR: Device marked as failed to repair by technician',
                created_by: currentUser.id,
                created_at: new Date().toISOString()
              });
          }
          
          // Then update the device status
          await updateDeviceStatus(deviceId, 'failed', '');
          
          // Show success message
          alert('Device has been marked as failed to repair successfully.');
          
          // Reload the page to show updated status
          window.location.reload();
        } else {
          await saveActionOffline({ type: 'markDeviceFailed', payload: { deviceId, remark } });
          alert('You are offline. Device failure status will be synced when you are back online.');
        }
      } catch (error) {
        console.error('Error marking device as failed:', error);
        alert('Error marking device as failed. Please try again.');
      }
    }
  };
  
  // Removed: handleSignatureComplete and showSignature logic

  // Check if device is already assigned
  const isDeviceAssigned = !!currentTechId;

  return (
    <div className="space-y-6">
      {/* Only show technician selection if device is not already assigned */}
      {!isDeviceAssigned ? (
        <div>
          <label className="block text-gray-700 font-medium mb-2">Select Technician</label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="w-full h-[45px] px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg text-base"
          >
            <option value="">Select a technician...</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.email})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-blue-600">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-medium">Device is already assigned to a technician</span>
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">Add Remark (Optional)</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="w-full h-[100px] px-4 py-3 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg resize-none"
          placeholder="Add any additional notes..."
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => {
              // Placeholder: Save remark logic here
              setRemark('');
              alert('Remark added!');
            }}
            disabled={!remark.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
            type="button"
          >
            Add Remark
          </button>
        </div>
      </div>
      
      {/* Only show the Assign button if the device is not already assigned */}
      {!currentTechId && (
        <button
          onClick={handleAssign}
          disabled={!selectedTechId}
          className={`w-full h-[70px] rounded-lg flex items-center justify-center gap-4 text-xl font-semibold
            transition-all duration-300 shadow-xl border transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl
            ${selectedTechId
              ? 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-blue-400/40'
              : 'bg-gradient-to-r from-gray-500/60 to-gray-600/60 text-gray-300 border-gray-400/30'
            } backdrop-blur-md`}
          >
            <Rocket size={28} strokeWidth={2.5} />
            Assign
          </button>
      )}
      {/* Only show Mark as Failed to Repair button for assigned technician only */}
      {currentUser.role === 'technician' && currentTechId === currentUser.id && (
        <div className="space-y-3">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium text-sm">Emergency Action</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Use this button only if the device cannot be repaired due to technical issues, missing parts, or other critical problems.
            </p>
            <button
              onClick={handleMarkFailed}
              className="w-full h-[50px] rounded-lg bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white font-semibold hover:from-red-600/90 hover:to-pink-600/90 transition-all duration-200 flex items-center justify-center gap-2"
              type="button"
            >
              ⚠️ Failed to Repair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTechnicianForm;