import React, { useState, useEffect } from 'react';
import googleSheetsAPI from '../utils/googleSheets';
import './GoogleSheetsViewer.css';

const GoogleSheetsViewer = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    fetchSheetData();
  }, []);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the sheet metadata to see available sheets
      const metadata = await googleSheetsAPI.getSheetMetadata();
      setSheets(metadata.sheets);

      // Get data from the first sheet by default
      if (metadata.sheets.length > 0) {
        const sheetData = await googleSheetsAPI.getSheetByName(metadata.sheets[0].title);
        setData(sheetData);
        setSelectedSheet(metadata.sheets[0].title);
      }
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setError(err.message || 'Failed to fetch sheet data');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = async (sheetName) => {
    try {
      setLoading(true);
      setError(null);
      
      const sheetData = await googleSheetsAPI.getSheetByName(sheetName);
      setData(sheetData);
      setSelectedSheet(sheetName);
    } catch (err) {
      console.error('Error fetching sheet:', err);
      setError(err.message || 'Failed to fetch sheet data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchSheetData();
  };

  if (loading && !data) {
    return (
      <div className="sheets-viewer">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Google Sheets data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sheets-viewer">
        <div className="error">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={refreshData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheets-viewer">
      <div className="header">
        <h2>Google Sheets Data</h2>
        <button onClick={refreshData} className="refresh-btn">
          Refresh
        </button>
      </div>

      {sheets.length > 1 && (
        <div className="sheet-selector">
          <label htmlFor="sheet-select">Select Sheet: </label>
          <select
            id="sheet-select"
            value={selectedSheet || ''}
            onChange={(e) => handleSheetChange(e.target.value)}
          >
            {sheets.map((sheet) => (
              <option key={sheet.sheetId} value={sheet.title}>
                {sheet.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {data && (
        <div className="data-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {data.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="data-info">
            <p>
              Showing {data.rows.length} rows from sheet "{selectedSheet}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsViewer;