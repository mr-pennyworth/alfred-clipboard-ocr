import Foundation
import Vision
import CoreGraphics

func performOCR(on image: CGImage) {
    // Create a request handler using the image
    let requestHandler = VNImageRequestHandler(cgImage: image, options: [:])

    // Create an OCR request
    let request = VNRecognizeTextRequest(completionHandler: { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            print("Failed to perform OCR.")
            return
        }

        // Extract recognized text from observations
        let recognizedText = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }

        // Print the recognized text
        print(recognizedText.joined(separator: "\n"))
    })

    // Set the recognition level to accurate for better results
    request.recognitionLevel = .accurate

    // Perform the OCR request
    do {
        try requestHandler.perform([request])
    } catch {
        print("Error performing OCR: \(error)")
    }
}

// Check if the command-line argument for the image file path is provided
guard let imagePath = CommandLine.arguments.dropFirst().first else {
    print("Please provide the image file path as an argument.")
    exit(1)
}

// Load the image from the provided file path
guard let imageURL = URL(string: "file://\(imagePath)"),
      let imageSource = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    print("Failed to load the image.")
    exit(1)
}

// Perform OCR on the image
performOCR(on: image)
