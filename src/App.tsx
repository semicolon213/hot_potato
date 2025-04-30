import './App.css'
import { useEffect, useState } from 'react'
import { gapi } from 'gapi-script'

const clientId = import.meta.env.VITE_CLIENT_ID
const apiKey = import.meta.env.VITE_API_KEY
const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
const range = import.meta.env.VITE_RANGE

function App() {
    const [data, setData] = useState<string[][]>([])
    const [input, setInput] = useState('')
    const [selectedRow, setSelectedRow] = useState<number | null>(null)

    useEffect(() => {
        const start = () => {
            gapi.client.init({
                apiKey: apiKey,
                clientId: clientId,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                scope: 'https://www.googleapis.com/auth/spreadsheets',
            }).then(() => {
                return gapi.auth2.getAuthInstance().signIn()
            }).then(() => {
                getSheetData()
            })
        }

        gapi.load('client:auth2', start)
    }, [])

    // range에서 시트 이름 추출
    const getSheetName = () => {
        // range 형식이 'Sheet1!A1:B10' 같은 형태라고 가정
        return range.split('!')[0]
    }

    // 데이터 조회
    const getSheetData = async () => {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            })
            setData(response.result.values || [])
            setSelectedRow(null)
        } catch (error) {
            console.error('데이터 조회 실패:', error)
        }
    }

    // 데이터 추가
    const appendSheetData = async () => {
        if (!input) return
        try {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: `${getSheetName()}!A1`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[input]],
                },
            })
            setInput('')
            getSheetData()
        } catch (error) {
            console.error('데이터 추가 실패:', error)
        }
    }

    // 데이터 수정
    const updateSheetData = async () => {
        if (selectedRow === null || !input) {
            alert('수정할 항목을 선택하고 새로운 값을 입력해주세요.')
            return
        }
        try {
            const updateRange = `${getSheetName()}!A${selectedRow + 1}`
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: updateRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [[input]]
                }
            })
            setInput('')
            setSelectedRow(null)
            getSheetData()
        } catch (error) {
            console.error('데이터 수정 실패:', error)
        }
    }

    // 데이터 삭제
    const deleteSheetData = async () => {
        if (selectedRow === null) return
        try {
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: 0,
                                    dimension: 'ROWS',
                                    startIndex: selectedRow,
                                    endIndex: selectedRow + 1
                                }
                            }
                        }
                    ]
                }
            })
            setSelectedRow(null)
            setInput('')
            getSheetData()
        } catch (error) {
            console.error('데이터 삭제 실패:', error)
        }
    }

    return (
        <>
            <h1>Google Sheets 연결 (gapi + OAuth)</h1>
            <div style={{ marginBottom: '20px' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="내용을 입력하세요"
                    style={{ marginRight: '10px', width: '200px' }}
                />
                <button onClick={getSheetData} style={{ marginRight: '5px' }}>조회</button>
                <button onClick={appendSheetData} style={{ marginRight: '5px' }}>추가</button>
                <button onClick={updateSheetData} style={{ marginRight: '5px' }}>수정</button>
                <button
                    onClick={deleteSheetData}
                    disabled={selectedRow === null}
                >
                    삭제
                </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.map((row, i) => (
                    <li
                        key={i}
                        onClick={() => setSelectedRow(i)}
                        style={{
                            padding: '8px',
                            cursor: 'pointer',
                            backgroundColor: selectedRow === i ? '#e0e0e0' : 'transparent',
                            border: '1px solid #ddd',
                            marginBottom: '4px',
                            borderRadius: '4px'
                        }}
                    >
                        {row.join(' | ')}
                    </li>
                ))}
            </ul>
        </>
    )
}

export default App
