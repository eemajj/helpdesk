// Test script to simulate form submission
const axios = require('axios');

async function testFormSubmission() {
    console.log('🧪 Testing Ticket Form Submission...');
    
    const formData = {
        problemType: "คอมพิวเตอร์",
        problemDescription: "คอมพิวเตอร์เปิดไม่ติด หน้าจอดำ ตรวจสอบไฟแล้วปกติ ต้องการความช่วยเหลือด่วน",
        fullName: "นายทดสอบ ระบบงาน",
        phoneNumber: "0812345678",
        department: "สลก.",
        division: "ฝ่ายเทคโนโลยีสารสนเทศ",
        assetNumber: "PC-DWF-2024-001"
    };
    
    try {
        console.log('📤 Submitting form data:', formData);
        
        const response = await axios.post('http://localhost:3000/api/tickets', formData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Form submission successful!');
        console.log('📋 Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`🎫 Ticket ID: ${response.data.ticket.ticketId}`);
            console.log(`📅 Created: ${response.data.ticket.createdAt}`);
            console.log(`🏷️ Status: ${response.data.ticket.status}`);
        }
        
    } catch (error) {
        console.error('❌ Form submission failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
    }
}

testFormSubmission();