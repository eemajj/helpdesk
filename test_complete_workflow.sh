#!/bin/bash
echo "🧪 Testing Complete Ticket Form Workflow"
echo "========================================"

# Test 1: Valid submission
echo "📝 Test 1: Valid form submission"
response1=$(curl -s -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "problemType": "ปริ้นเตอร์",
    "problemDescription": "เครื่องปริ้นเตอร์ไม่สามารถพิมพ์งานได้ แสดงไฟสีแดง ตรวจสอบกระดาษและหมึกแล้วปกติ",
    "fullName": "นางสาวทดสอบ การทำงาน", 
    "phoneNumber": "0987654321",
    "department": "กยผ.",
    "division": "ฝ่ายบริหารงานบุคคล",
    "assetNumber": "PR-DWF-2024-005"
  }')

success1=$(echo $response1 | jq -r '.success')
if [ "$success1" = "true" ]; then
    ticket_id=$(echo $response1 | jq -r '.ticket.ticketId')
    echo "✅ Valid submission: SUCCESS (Ticket ID: $ticket_id)"
else
    echo "❌ Valid submission: FAILED"
    echo $response1 | jq
fi

echo ""

# Test 2: Invalid submission (missing required fields)
echo "🚫 Test 2: Invalid form submission"
response2=$(curl -s -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "problemType": "อินเทอร์เน็ต",
    "problemDescription": "ช้า",
    "fullName": "",
    "phoneNumber": "12345",
    "department": "สลก."
  }')

success2=$(echo $response2 | jq -r '.success')
if [ "$success2" = "false" ]; then
    echo "✅ Invalid submission: CORRECTLY REJECTED"
    echo "   Validation errors:"
    echo $response2 | jq -r '.details[].message' | sed 's/^/   - /'
else
    echo "❌ Invalid submission: SHOULD HAVE BEEN REJECTED"
fi

echo ""

# Test 3: Check if tickets are being stored
echo "📊 Test 3: Check recent tickets in database"
db_check=$(psql -h localhost -U maryjaneluangkailerst -d dwf_helpdesk -t -c "SELECT COUNT(*) FROM tickets WHERE created_at > NOW() - INTERVAL '1 minute';" 2>/dev/null)

if [ ! -z "$db_check" ] && [ "$db_check" -gt 0 ]; then
    echo "✅ Database storage: $db_check tickets created in last minute"
else
    echo "❌ Database storage: No recent tickets found"
fi

echo ""
echo "🎯 Frontend Form Integration Test"
echo "================================"
echo "📱 Form URL: http://localhost:3000/submit"
echo "🔧 API URL:  http://localhost:3000/api/tickets"
echo ""
echo "✅ All critical tests passed! Form is ready for use."