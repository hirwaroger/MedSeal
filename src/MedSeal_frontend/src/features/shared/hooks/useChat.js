import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export const useChat = (showAlert) => {
  const [loading, setLoading] = useState(false);
  const { authenticatedActor } = useAuth();

  const sendGeneralChat = async (messages, userType) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return null;
    }

    setLoading(true);
    try {
      console.log('LOG: Sending general chat with context:', { userType, messageCount: messages.length });
      
      const context = { user_type: userType };
      const result = await authenticatedActor.chat_general(messages, context);
      
      console.log('LOG: General chat result:', result);
      
      if ('Ok' in result) {
        return result.Ok;
      } else {
        console.error('LOG: General chat failed:', result.Err);
        showAlert('error', 'Chat error: ' + result.Err);
        return null;
      }
    } catch (error) {
      console.error('LOG: Error in general chat:', error);
      showAlert('error', 'Error sending message: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendPrescriptionChat = async (messages, userType, prescriptionData) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return null;
    }

    setLoading(true);
    try {
      console.log('LOG: Sending prescription chat with context:', { userType, messageCount: messages.length });
      
      const context = { 
        user_type: userType,
        prescription_data: prescriptionData 
      };
      const result = await authenticatedActor.chat_prescription(messages, context);
      
      console.log('LOG: Prescription chat result:', result);
      
      if ('Ok' in result) {
        return result.Ok;
      } else {
        console.error('LOG: Prescription chat failed:', result.Err);
        showAlert('error', 'Chat error: ' + result.Err);
        return null;
      }
    } catch (error) {
      console.error('LOG: Error in prescription chat:', error);
      showAlert('error', 'Error sending message: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendMedicineChat = async (messages, userType, medicineData) => {
    if (!authenticatedActor) {
      showAlert('error', 'Backend connection not available');
      return null;
    }

    setLoading(true);
    try {
      console.log('LOG: Sending medicine chat with context:', { userType, messageCount: messages.length });
      
      const context = { 
        user_type: userType,
        medicine_data: medicineData 
      };
      const result = await authenticatedActor.chat_medicine(messages, context);
      
      console.log('LOG: Medicine chat result:', result);
      
      if ('Ok' in result) {
        return result.Ok;
      } else {
        console.error('LOG: Medicine chat failed:', result.Err);
        showAlert('error', 'Chat error: ' + result.Err);
        return null;
      }
    } catch (error) {
      console.error('LOG: Error in medicine chat:', error);
      showAlert('error', 'Error sending message: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendGeneralChat,
    sendPrescriptionChat,
    sendMedicineChat
  };
};
