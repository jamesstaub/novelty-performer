# Python version
Basic pitch requires python 3.9 
`pyenv install 3.9.0`

# Create venv
`python -m venv novelty-performer --system-site-packages`

# Activate venv
` source novelty-performer/bin/activate` 

# Upgrade pip
`pip install --upgrade pip`

# Install requirements
`pip install -r requirements.txt`

# Run Basic Pitch Server
`python server.py`

While running, the python script will monitor the directory for audio files. When a new file is added, it will be processed and the resulting midi file will be saved in the same directory as the audio file.