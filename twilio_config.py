from twilio.rest import Client

account_sid = '-'
auth_token = '-'
verify_service_sid = '-'  # Replace with your Verify Service SID

client = Client(account_sid, auth_token)

def send_otp(phone_number):
    verification = client.verify.services(verify_service_sid).verifications.create(to=phone_number, channel='sms')
    return verification.sid

def verify_otp(phone_number, otp):
    verification_check = client.verify.services(verify_service_sid).verification_checks.create(to=phone_number, code=otp)
    return verification_check.status == 'approved'
