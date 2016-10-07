var configmail = require('../config.mail');
var logger = require('./logger');
var nodemailer = require('nodemailer');
var fs = require('fs');

var transporter_url = 'smtps://'+configmail.smtp.user+':'+configmail.smtp.pass+'@'+configmail.smtp.url;
var transporter = nodemailer.createTransport(transporter_url);

function sendingMail(subj, picpath) {

  try {
    fs.accessSync(picpath, fs.F_OK);
    logger.debug("File found: ", picpath);    
    
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
  } catch(e) {
    logger.warn("File not found: ", picpath);

    var mailOptions = {
      from: configmail.smtp.from,
      to: configmail.smtp.to,
      subject: subj,
      text: 'Status Update from Garage JS',
      html: '<b>Status Update from Garage JS</b><br/>No picture available.'
    };
  }

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return logger.error(error);
    }
    logger.info('Message sent: ' + info.response + ' with filename: ' + picpath);
  });
}

exports.sendingMail = sendingMail;
