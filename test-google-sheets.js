const googleSheetsAPI = require('./src/utils/googleSheets');

async function testGoogleSheetsConnection() {
  console.log('🔍 Testing Google Sheets API Connection...\n');

  try {
    // Test 1: Get sheet metadata
    console.log('📋 Fetching sheet metadata...');
    const metadata = await googleSheetsAPI.getSheetMetadata();
    console.log('✅ Sheet Title:', metadata.title);
    console.log('📊 Available Sheets:', metadata.sheets.map(s => s.title).join(', '));
    console.log('');

    // Test 2: Get data from first sheet
    console.log('📄 Fetching data from first sheet...');
    const firstSheet = metadata.sheets[0];
    const sheetData = await googleSheetsAPI.getSheetByName(firstSheet.title);
    
    console.log('✅ Headers:', sheetData.headers.join(' | '));
    console.log('📈 Total Rows:', sheetData.rows.length);
    
    if (sheetData.rows.length > 0) {
      console.log('📝 First Row Sample:', sheetData.rows[0].join(' | '));
    }
    
    console.log('\n🎉 All tests passed! Your Google Sheets API is working correctly.');
    console.log('\n💡 You can now run "npm start" to view the data in your React app.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check that you have set up your API credentials in .env file');
    console.log('2. Ensure Google Sheets API is enabled in Google Cloud Console');
    console.log('3. If using API key, make sure your sheet is publicly accessible');
    console.log('4. Verify the sheet ID is correct');
    console.log('\n📖 See setup-google-sheets.md for detailed setup instructions.');
  }
}

// Run the test
testGoogleSheetsConnection();