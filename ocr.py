import os
import sqlite3
import subprocess
import sys

HOME = os.path.expanduser('~')
DB_DIR = HOME + '/Library/Application Support/Alfred/Databases'
IMAGES_DIR = DB_DIR + '/clipboard.alfdb.data'
DB_PATH = DB_DIR + '/clipboard.alfdb'

WORKFLOW_DIR = sys.path[0]

TESSERACT = WORKFLOW_DIR + '/Tesseract.app/Contents/MacOS/tesseract'
TESSDATA = WORKFLOW_DIR + '/Tesseract.app/Contents/Resources'

def imgtxt(img_filename):
  img_filepath = IMAGES_DIR + '/' + img_filename
  return subprocess.check_output([
    TESSERACT,
    '--tessdata-dir', TESSDATA,
    img_filepath,
    'stdout'
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
    new_txt = 'img: ' + ocr_txt
    
  db.execute('UPDATE clipboard SET item = ? WHERE dataHash == ?',
             (new_txt, img_filename))

db.commit()
