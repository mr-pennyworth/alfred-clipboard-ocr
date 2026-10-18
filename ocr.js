// Run with: /usr/bin/osascript -l JavaScript ocr.js
ObjC.import('Foundation');
ObjC.import('Vision');
ObjC.import('ImageIO');
ObjC.import('CoreGraphics');

function sqlText(value) {
    // The JXA bridge can normalize Unicode in NSTask arguments. Pass text as
    // ASCII hex so that both Unicode and SQL metacharacters remain unchanged.
    const hex = encodeURIComponent(value).replace(/%([0-9A-F]{2})|([^%])/g,
        function (match, byte, ascii) {
            return byte || ('0' + ascii.charCodeAt(0).toString(16)).slice(-2);
        });
    return "CAST(X'" + hex + "' AS TEXT)";
}

function sqlite(database, query) {
    // Do not use a shell. Paths and SQL must remain separate arguments.
    const task = $.NSTask.alloc.init;
    task.launchPath = '/usr/bin/sqlite3';
    task.arguments = $([
        '-init', '/dev/null', '-batch', '-bail', '-noheader', '-cmd', '.timeout 5000',
        database, query
    ]);
    const pipe = $.NSPipe.pipe;
    task.standardOutput = pipe;
    task.standardError = pipe;
    task.launch;
    const data = pipe.fileHandleForReading.readDataToEndOfFile;
    task.waitUntilExit;
    const output = ObjC.unwrap($.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding));
    if (task.terminationStatus !== 0) {
        throw new Error('SQLite failed: ' + output.trim());
    }
    return output;
}

function decodeHex(hex) {
    // Hex output keeps newlines, separators, and Unicode out of the row format.
    return decodeURIComponent(hex.replace(/../g, '%$&'));
}

function recognizeText(path) {
    // Vision reads PNG and TIFF files directly. No temporary conversion is needed.
    const url = $.NSURL.fileURLWithPath(path);
    const source = $.CGImageSourceCreateWithURL(url, null);
    // The bridge returns C size_t values as strings, not JavaScript numbers.
    if (Number($.CGImageSourceGetCount(source)) === 0) {
        throw new Error('Cannot read the image file.');
    }
    const image = $.CGImageSourceCreateImageAtIndex(source, 0, null);
    if (Number($.CGImageGetWidth(image)) === 0) {
        throw new Error('Cannot decode the image file.');
    }
    const handler = $.VNImageRequestHandler.alloc.initWithCGImageOptions(image, $({}));
    const request = $.VNRecognizeTextRequest.alloc.init;
    request.recognitionLevel = 0; // VNRequestTextRecognitionLevelAccurate
    const error = Ref();
    if (!handler.performRequestsError($([request]), error)) {
        throw new Error(ObjC.unwrap(error[0].localizedDescription));
    }
    const observations = request.results;
    const lines = [];
    for (let i = 0; i < observations.count; i++) {
        const candidates = observations.objectAtIndex(i).topCandidates(1);
        if (candidates.count > 0) {
            lines.push(ObjC.unwrap(candidates.firstObject.string));
        }
    }
    return lines.join('\n').trim();
}

function run(argv) {
    let database = ObjC.unwrap($.NSHomeDirectory()) +
        '/Library/Application Support/Alfred/Databases/clipboard.alfdb';
    // Use a separate database for tests. Never create a missing clipboard database.
    if (argv.length === 2 && argv[0] === '--database') {
        database = ObjC.unwrap($(argv[1]).stringByStandardizingPath);
    } else if (argv.length !== 0) {
        throw new Error('Usage: osascript -l JavaScript ocr.js [--database PATH]');
    }
    if (!$.NSFileManager.defaultManager.fileExistsAtPath(database)) {
        throw new Error('Clipboard database not found: ' + database);
    }

    const output = sqlite(database,
        "SELECT hex(item) || '|' || hex(dataHash) FROM clipboard " +
        "WHERE dataType = 1 AND item LIKE 'Image:%' AND dataHash IS NOT NULL;");
    if (!output.trim()) return;

    let failures = 0;
    output.trim().split('\n').forEach(function (row) {
        const fields = row.split('|');
        const original = decodeHex(fields[0]);
        const filename = decodeHex(fields[1]);
        try {
            const text = recognizeText(database + '.data/' + filename);
            const replacement = text ? 'img: ' + text : original.replace(/^Image:/i, 'img:');
            // Do not overwrite a clipboard entry that changed during OCR.
            sqlite(database, 'UPDATE clipboard SET item = ' + sqlText(replacement) +
                ' WHERE dataType = 1 AND dataHash = ' + sqlText(filename) +
                ' AND item = ' + sqlText(original) + ';');
        } catch (error) {
            failures++;
            console.log('OCR failed for ' + filename + ': ' + error.message);
        }
    });
    if (failures > 0) {
        // Failed images keep their original names and can be tried again later.
        throw new Error('OCR failed for ' + failures + ' image(s). See the log for details.');
    }
}
