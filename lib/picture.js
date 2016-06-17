var childproc = require('child_process');
var dateForm = require('dateformat');
var photonum = 0;

function takePicture() {
  var now = new Date();
  now = dateForm(now, "isoDateTime");
  var filename = 'photo/image_'+photonum+'_'+now+'.jpg';
  var args = ['-w', '640', '-h', '480', '-o', filename, '-t', '1'];
  // option with -t (in ms) important as otherwise default is 5s. vf,hf used to flip image if camera is upside down.
  var spawn = childproc.spawn('raspistill', args);

  spawn.on('exit', function(code) {
    console.log('Saved photo: ' + filename + ', Exit code: ' + code);
    photonum++;
  });
  return filename;
}

exports.takePicture = takePicture;
