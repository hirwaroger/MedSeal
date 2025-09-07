import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../shared/components/Button';

function VerificationManager() {
  const { authenticatedActor } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [authenticatedActor]);

  const load = async () => {
    if (!authenticatedActor) return;
    setLoading(true);
    try {
      const res = await authenticatedActor.get_pending_verification_requests();
      let reqs = [];
      if (Array.isArray(res)) reqs = res;
      else if (res && 'Ok' in res) reqs = res.Ok;

      // Fetch doctor names for display
      const withNames = await Promise.all(reqs.map(async (r) => {
        try {
          const userRes = await authenticatedActor.get_user(r.doctor_id);
          if (userRes && userRes.Ok) {
            return { ...r, doctor_name: userRes.Ok.name };
          }
          // Backend may return opt directly
          if (userRes && Array.isArray(userRes) && userRes.length > 0) return { ...r, doctor_name: userRes[0].name };
        } catch (e) {
          console.error('Failed to load user for request', r, e);
        }
        return { ...r, doctor_name: r.doctor_id };
      }));

      setRequests(withNames);
    } catch (e) {
      console.error('Failed to load verification requests', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const process = async (id, statusKey, notes) => {
    if (!authenticatedActor) return;
    setActionLoading(id + statusKey);
    try {
      const payload = {
        verification_id: id,
        status: { [statusKey]: null },
        admin_notes: notes && notes.trim() ? [notes.trim()] : [],
      };
      const res = await authenticatedActor.process_verification_request(payload);
      if (res && 'Ok' in res) {
        await load();
      } else if (res && 'Err' in res) {
        throw new Error(res.Err);
      }
    } catch (e) {
      console.error('Error processing verification request', e);
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading verification requests...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Doctor Verification Requests</h1>
      {error && <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>}
      {requests.length === 0 && <div className="p-4 bg-blue-50 text-blue-700 rounded">No pending requests.</div>}
      <div className="space-y-4">
        {requests.map(r => {
          const statusKey = Object.keys(r.status)[0];
          return (
            <div key={r.id} className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-gray-900">Request #{r.id}</h2>
                  <p className="text-sm text-gray-600">Doctor: {r.doctor_name}</p>
                  <p className="text-sm text-gray-600">Institution: {r.institution_name}</p>
                  <p className="text-sm text-gray-600">License: {r.medical_license_number}</p>
                  <p className="text-sm mt-1"><span className="font-medium">Status:</span> {statusKey}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    disabled={actionLoading !== null}
                    loading={actionLoading === r.id + 'Approved'}
                    onClick={() => process(r.id, 'Approved', 'Verified')}
                  >Approve</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={actionLoading !== null}
                    loading={actionLoading === r.id + 'Rejected'}
                    onClick={() => process(r.id, 'Rejected', 'Insufficient credentials')}
                  >Reject</Button>
                </div>
              </div>
              {r.additional_documents && r.additional_documents.length > 0 && (
                <div className="mt-3 text-sm text-gray-700">
                  <p className="font-medium">Documents:</p>
                  <ul className="list-disc ml-5">
                    {r.additional_documents.map((d,i) => <li key={i}><a className="text-blue-600 hover:underline" href={d} target="_blank" rel="noopener noreferrer">{d}</a></li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VerificationManager;