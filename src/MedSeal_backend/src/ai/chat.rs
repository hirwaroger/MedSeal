use crate::shared::types::*;
use crate::shared::storage::*;
use ic_llm;

fn to_ic_llm_messages(messages: Vec<ChatMessage>, system_prompt: String) -> Vec<ic_llm::ChatMessage> {
    let mut ic_msgs = Vec::new();
    ic_msgs.push(ic_llm::ChatMessage::System { content: system_prompt });
    for m in messages.into_iter() {
        match m.role.as_str() {
            "user" => ic_msgs.push(ic_llm::ChatMessage::User { content: m.content }),
            "assistant" => ic_msgs.push(ic_llm::ChatMessage::Assistant(ic_llm::AssistantMessage { content: Some(m.content), tool_calls: vec![] })),
            _ => ic_msgs.push(ic_llm::ChatMessage::User { content: m.content }),
        }
    }
    ic_msgs
}

#[ic_cdk::update]
pub async fn chat_general(messages: Vec<ChatMessage>, context: GeneralChatContext) -> Result<String> {
    let system_prompt = format!(
        "You are MedSeal AI, a helpful medical assistant. The user is a {}. \nProvide helpful, accurate medical information while always recommending consulting with healthcare professionals for serious concerns.",
        context.user_type
    );

    let ic_messages = to_ic_llm_messages(messages, system_prompt);

    let response = ic_llm::chat(ic_llm::Model::Llama3_1_8B)
        .with_messages(ic_messages)
        .send()
        .await;

    let content = response.message.content.unwrap_or_else(|| "I couldn't generate a response.".to_string());
    Ok(content)
}

#[ic_cdk::update]
pub async fn chat_prescription(messages: Vec<ChatMessage>, context: PrescriptionChatContext) -> Result<String> {
    let system_prompt = format!(
        "You are MedSeal AI, a helpful medical assistant. The user is a {}. \nYou have access to the following prescription data: {}\nHelp the user understand their prescription, medications, dosages, and instructions. Always recommend consulting with their doctor for any concerns.",
        context.user_type, context.prescription_data
    );

    let ic_messages = to_ic_llm_messages(messages, system_prompt);

    let response = ic_llm::chat(ic_llm::Model::Llama3_1_8B)
        .with_messages(ic_messages)
        .send()
        .await;

    let content = response.message.content.unwrap_or_else(|| "I couldn't generate a response.".to_string());
    Ok(content)
}

#[ic_cdk::update]
pub async fn chat_medicine(messages: Vec<ChatMessage>, context: MedicineChatContext) -> Result<String> {
    let system_prompt = format!(
        "You are MedSeal AI, a helpful medical assistant. The user is a {}. \nYou have access to the following medicine data: {}\nHelp the user understand this medication, its uses, dosage, side effects, and precautions. Always recommend consulting with their healthcare provider for personalized advice.",
        context.user_type, context.medicine_data
    );

    let ic_messages = to_ic_llm_messages(messages, system_prompt);

    let response = ic_llm::chat(ic_llm::Model::Llama3_1_8B)
        .with_messages(ic_messages)
        .send()
        .await;

    let content = response.message.content.unwrap_or_else(|| "I couldn't generate a response.".to_string());
    Ok(content)
}

#[ic_cdk::update]
pub async fn get_prescription_ai_help(prescription_code: String, patient_contact: String, question: String) -> Result<String> {
    // Get prescription data
    let prescription = match get_prescription_by_code(&prescription_code) {
        Some(prescription) => {
            if prescription.patient_contact != patient_contact {
                return Err("Invalid prescription code or patient contact".to_string());
            }
            prescription
        },
        None => return Err("Prescription not found".to_string()),
    };

    // Build prescription context
    let mut prescription_data = format!(
        "Prescription for: {}\nDoctor ID: {}\nAdditional Notes: {}\nMedicines:\n",
        prescription.patient_name, prescription.doctor_id, prescription.additional_notes
    );

    for med in &prescription.medicines {
        if let Some(medicine) = get_medicine(&med.medicine_id) {
            prescription_data.push_str(&format!(
                "- {} ({}), Frequency: {}, Duration: {}\n",
                medicine.name, medicine.dosage, medicine.frequency, medicine.duration
            ));
            if let Some(custom_dosage) = &med.custom_dosage {
                prescription_data.push_str(&format!("  Custom Dosage: {}\n", custom_dosage));
            }
            if !med.custom_instructions.is_empty() {
                prescription_data.push_str(&format!("  Instructions: {}\n", med.custom_instructions));
            }
            prescription_data.push_str(&format!("  Side Effects: {}\n", medicine.side_effects));
        }
    }

    let context = PrescriptionChatContext {
        user_type: "Patient".to_string(),
        prescription_data,
    };

    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: question,
    }];

    chat_prescription(messages, context).await
}

#[ic_cdk::update]
pub async fn get_medicine_ai_help(medicine_id: String) -> Result<String> {
    let medicine = match get_medicine(&medicine_id) {
        Some(medicine) => medicine,
        None => return Err("Medicine not found".to_string()),
    };

    let medicine_data = format!(
        "Medicine: {}\nDosage: {}\nFrequency: {}\nDuration: {}\nSide Effects: {}\nGuide: {}",
        medicine.name, medicine.dosage, medicine.frequency,
        medicine.duration, medicine.side_effects, medicine.guide_text
    );

    let context = MedicineChatContext {
        user_type: "Patient".to_string(),
        medicine_data,
    };

    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: "Please provide information about this medicine, including its uses, proper dosage, and important precautions.".to_string(),
    }];

    chat_medicine(messages, context).await
}