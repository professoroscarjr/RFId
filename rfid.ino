#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10   // Chip Select Pin
#define RST_PIN 9   // Reset Pin

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

void setup() {
  Serial.begin(9600); // Initialize serial communications with the PC
  while (!Serial);    // Wait for serial port to connect. Needed for native USB

  SPI.begin();         // Init SPI bus
  mfrc522.PCD_Init();  // Init MFRC522
  Serial.println("Aproxime o seu cartao RFID...");
  Serial.println("-----------------------------");
}

void loop() {
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Show some details of the PICC (Personal ID Card)
  Serial.print("UID:"); // Marcador para o Node.js identificar o UID
  String content = "";
  byte letter;
  for (byte i = 0; i < mfrc522.uid.size; i++) {
     content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "")); // Add leading zero for single hex digits
     content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase(); // Convert to uppercase for consistency
  Serial.println(content); // Envia o UID completo

  mfrc522.PICC_HaltA(); // Stop reading
}
