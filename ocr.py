import os
import sqlite3
import subprocess
import sys

HOME = os.path.expanduser('~')
DB_DIR = HOME + '/Library/Application Support/Alfred/Databases'
IMAGES_DIR = DB_DIR + '/clipboard.alfdb.data'
DB_PATH = DB_DIR + '/clipboard.alfdb'

WORKFLOW_DIR = sys.path[0]

def imgtxt(img_filename):
  img_filepath = IMAGES_DIR + '/' + img_filename
  if img_filepath.endswith('tiff'):
    tmp_path = f'/tmp/{os.path.basename(img_filepath)}.png'
    subprocess.check_call([
      'sips',
      '-s', 'format', 'png',
      img_filepath,
      '--out', tmp_path,
    ])
    img_filepath = tmp_path
  return subprocess.check_output([
    'swift', f'{WORKFLOW_DIR}/ocr.swift', img_filepath
  ])


db = sqlite3.connect(DB_PATH)
db.text_factory = str

rows = db.execute('''
  SELECT item, dataHash
  FROM clipboard
  WHERE dataType == 1 AND item LIKE "Image:%"'''
).fetchall()


for (txt, img_filename) in rows:
  if img_filename is None: continue
  new_txt = txt.replace('Image:', 'img:')
  ocr_txt = imgtxt(img_filename).strip()
  if ocr_txt:
    new_txt = 'img: ' + ocr_txt.decode()

  db.execute('UPDATE clipboard SET item = ? WHERE dataHash == ?',
             (new_txt, img_filename))

db.commit()
