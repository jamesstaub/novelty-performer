const path = require('path');
const { spawn, exec } = require('child_process');
const maxAPI = require('max-api');

function killPythonProcess() {
  const bashScript = `
  pids=\$(ps -ef | grep server.py | grep -v grep | awk '{print $2}')

  if [ -n "\$pids" ]; then
      for pid in \$pids; do
          kill -9 "\$pid"
          echo "Process with PID \$pid has been killed."
      done
  else
      echo "No matching processes found."
  fi
  `;

  const child = spawn('bash', ['-c', bashScript]);

  child.stdout.on('data', (data) => {
    console.log(`killPythonProcess: stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`killPythonProcess: stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`killPythonProcess: child process exited with code ${code}`);
  });

}

function launchPythonProcess() {
  const { spawn } = require('child_process');

  // Command to activate the virtual environment\
  const activateVenvCmd = 'source novelty-performer/bin/activate';

  // Command to run the Python script within the virtual environment
  const pythonScriptCmd = 'python3 server.py';

  // Combine the commands and execute them in a shell
  const combinedCmd = `${activateVenvCmd} && ${pythonScriptCmd}`;

  // Launch the combined command using spawn
  const pythonProcess = spawn('/bin/bash', ['-c', combinedCmd]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`launchPythonProcess: Server stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.warn(`launchPythonProcess: Server stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log('launchPythonProcess: Server process exited with code', code);
  });

  // // Add a signal handler to catch termination signals
  // process.on('SIGINT', () => {
  //   console.log('Received termination signal. Terminating Python process...');
  //   // Send termination signal to the Python process
  //   pythonProcess.kill('SIGINT');
  // });
}

const handlers = {
  'bang': () => {
    console.log('kill Preexisting Python Processes');
    killPythonProcess();
    console.log('Launch new instance of Python');
    launchPythonProcess();
  },
  exit: () => {
    killPythonProcess();
  },
};

maxAPI.addHandlers(handlers);
