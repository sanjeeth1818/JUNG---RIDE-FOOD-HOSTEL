const { sendRegistrationEmail, sendPartnerRegistrationEmail } = require('./utils/emailService');

(async () => {
    console.log('Sending test registration email...');
    await sendRegistrationEmail('projectJUNGpro1@gmail.com', 'Test User');

    console.log('Sending test partner registration email...');
    await sendPartnerRegistrationEmail('projectJUNGpro1@gmail.com', 'Test Partner');

    console.log('Done.');
})();
