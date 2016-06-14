var configmail = require('../config.mail');
var nodemailer = require('nodemailer');

var transporter_url = 'smtps://'+configmail.smtp.user+':'+configmail.smtp.pass+'@'+configmail.smtp.url;
var transporter = nodemailer.createTransport(transporter_url);

function sendingMail(subj, picpath) {
  var mailOptions = {
    from: configmail.smtp.from,
    to: configmail.smtp.to,
    subject: subj,
    text: 'Status Update from Garage JS',
    html: '<b>Status Update from Garage JS</b>',
    attachments: [
      {
        path: picpath,
        encoding: 'base64'
      }
    ]
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response + ' with filename: ' + picpath);
  });
}

exports.sendingMail = sendingMail;
