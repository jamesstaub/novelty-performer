import tensorflow as tf

from basic_pitch.inference import predict, predict_and_save
from basic_pitch import ICASSP_2022_MODEL_PATH
import numpy as np
import json
import time
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

import mido
from mido import Message
from mido import MidiFile
import pretty_midi

import ipdb;

# MIDI TRIGGERES TO MAX
# 1. note=127, channel=15

if __name__ == "__main__":
    print("launch")
    basic_pitch_model = tf.saved_model.load(str(ICASSP_2022_MODEL_PATH))
    try:
        outport = mido.open_output("to Max 1")
    except:
        print("Failed to bind to Max 1 midi port. Make sure Max is open")
        raise


    def process_pitch(path):
        model_output, midi_data, note_activations = predict(path, basic_pitch_model)
        midi_data.remove_invalid_notes()
        midi_data.write('basic_pitch_output.midi')
        # write_frequencies(midi_data)

        # send a midi note ping to tell  max that there's a
        # new midi file to read
        msg = Message('note_on', note=127, channel=15)
        outport.send(msg)
        return midi_data

    def on_created(event):
        print(f"processing {event.src_path}")
        try:
            process_pitch(event.src_path)
        except Exception as e:
            print("failed to process file")
            print(e)

    def on_modified(event):
        print(f"processing {event.src_path}")
        try:
            process_pitch(event.src_path)
        except Exception as e:
            print("failed to process file")
            print(e)

    # write json file with frequencies
    def write_frequencies(midi_data):
        print('There are {} time signature changes'.format(len(midi_data.time_signature_changes)))
        print('There are {} instruments'.format(len(midi_data.instruments)))
        # Initialize an empty list to store frequencies
        
        mubu_buffer = {
            "numBuffers": 1,
            "numTracks": len(midi_data.instruments),
            "tracks": []
        }
        
        col_names = ["frequency", "velocity", "duration"]

        # Loop through all the instruments in the pretty_midi object
        for track_idx, instrument in enumerate(midi_data.instruments):
            # Create an array of pitch bends for the instrument
            pitch_bends = np.array([(pb.time, pb.pitch) for pb in instrument.pitch_bends])

            # TODO:
            # separate pitchbend column (in cents) to a different track
            # to allow glissandos

            mubu_buffer["tracks"].append({
                "name": "inst-{}".format(track_idx),
                "hasTimeTags": 1,
                "mxRows": 1,
                "mxCols": len(col_names),
                "maxSize": len(instrument.notes) * len(col_names),
                "mxColNames": col_names,
                "buffers":[{
                    "mxRows": 1,
                    "mxCols": len(col_names),                    
                    "mxData": [],
                    "timeTags": [],
                    "info": ["gui", "interface multiwave", "thickness 3", "colormode rainbow", "autobounds 1"]
                }]
            })

            # Loop through all the notes in the instrument
            for note in instrument.notes:
                # Get the start time of the note
                note_time = note.start
                
                # Find the index of the most recent pitch bend event before the note
                idx = np.searchsorted(pitch_bends[:,0], note_time, side='right') - 1
                
                # If no pitch bend events were found, use a pitch bend of 0
                if idx < 0:
                    pitch_bend = 0
                else:
                    pitch_bend = pitch_bends[idx, 1]
                    pitch_bend = pretty_midi.pitch_bend_to_semitones(pitch_bend, semitone_range=2.0)

                
                # Get the MIDI note number
                midi_note = note.pitch

                # Calculate the frequency in Hz from the MIDI note and pitch bend
                frequency = pretty_midi.note_number_to_hz(midi_note + pitch_bend)
                
                # Append the frequency to the list of frequencies
                mubu_buffer["tracks"][track_idx]["buffers"][0]["timeTags"].append(note_time)
                
                # mubu columns are flattened into a single array
                mubu_buffer["tracks"][track_idx]["buffers"][0]["mxData"].append(frequency)
                mubu_buffer["tracks"][track_idx]["buffers"][0]["mxData"].append(note.velocity)
                mubu_buffer["tracks"][track_idx]["buffers"][0]["mxData"].append(note.get_duration())


        # write json file        
        with open('notes.json', 'w') as outfile:
            json.dump(mubu_buffer, outfile)

        
    
    patterns = ["*.wav"]
    ignore_patterns = None
    ignore_directories = False
    case_sensitive = True
    handler = PatternMatchingEventHandler(patterns, ignore_patterns, ignore_directories, case_sensitive)

    handler.on_created = on_created
    # handler.on_deleted = on_deleted
    # handler.on_modified = on_modified
    # handler.on_moved = on_moved

    path = "."
    go_recursively = False
    my_observer = Observer()
    my_observer.schedule(handler, path, recursive=go_recursively)

    
    my_observer.start()
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        my_observer.stop()
        my_observer.join()

