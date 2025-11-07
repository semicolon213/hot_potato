/**
 * @file LedgerExportModal.tsx
 * @brief 장부 내보내기 모달 컴포넌트
 * @details 엑셀 양식을 선택하고 필드 매핑을 설정하여 장부를 내보내는 컴포넌트입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import React, { useState, useRef } from 'react';
import type { LedgerEntry } from '../../../types/features/accounting';
import { useTemplateUI } from '../../../hooks/features/templates/useTemplateUI';
import type { Template } from '../../../hooks/features/templates/useTemplateUI';
import { initializeGoogleAPIOnce } from '../../../utils/google/googleSheetUtils';
import './accounting.css';

interface LedgerExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LedgerEntry[];
  spreadsheetId: string;
}

interface FieldMapping {
  field: string;
  cellRange: string; // 예: "A2", "B2:B100"
  enabled: boolean;
}

interface DateOptions {
  separateMonthDay: boolean;
  monthCell?: string;
  dayCell?: string;
}

interface AmountOptions {
  separateIncomeExpense: boolean;
  incomeCell?: string;
  expenseCell?: string;
}

interface PeriodOptions {
  enabled: boolean;
  sameCell: boolean; // 시작일과 종료일이 같은 셀인지
  dateCell?: string; // 같은 셀일 때 사용
  startDateCell?: string; // 다른 셀일 때 시작일
  endDateCell?: string; // 다른 셀일 때 종료일
  dateFormat: string; // 날짜 형식 (예: 'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD')
}

export const LedgerExportModal: React.FC<LedgerExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  spreadsheetId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateSpreadsheetId, setTemplateSpreadsheetId] = useState<string | null>(null);
  
  // 템플릿 시스템 사용
  const { allDefaultTemplates, personalTemplates, isLoadingTemplates } = useTemplateUI([], () => {}, '', '전체');
  
  // 엑셀 양식 템플릿만 필터링 (스프레드시트 타입)
  const excelTemplates = React.useMemo(() => {
    const allTemplates = [...allDefaultTemplates, ...personalTemplates];
    return allTemplates.filter(t => 
      t.mimeType === 'application/vnd.google-apps.spreadsheet' ||
      (t.documentId && !t.mimeType) // mimeType이 없는 경우도 포함
    );
  }, [allDefaultTemplates, personalTemplates]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { field: 'date', cellRange: '', enabled: false },
    { field: 'category', cellRange: '', enabled: false },
    { field: 'description', cellRange: '', enabled: false },
    { field: 'amount', cellRange: '', enabled: false },
    { field: 'source', cellRange: '', enabled: false },
    { field: 'balanceAfter', cellRange: '', enabled: false },
    { field: 'usagePeriod', cellRange: '', enabled: false },
  ]);
  const [dateOptions, setDateOptions] = useState<DateOptions>({
    separateMonthDay: false
  });
  const [amountOptions, setAmountOptions] = useState<AmountOptions>({
    separateIncomeExpense: false
  });
  const [periodOptions, setPeriodOptions] = useState<PeriodOptions>({
    enabled: false,
    sameCell: false,
    dateFormat: 'YYYY-MM-DD'
  });
  const [exportMode, setExportMode] = useState<'all' | 'monthly'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceInfo, setEvidenceInfo] = useState<Array<{ entryId: string; description: string; fileName: string; fileId: string }>>([]);
  const [sheetData, setSheetData] = useState<Array<Array<{ value: any; formattedValue?: string; backgroundColor?: string; textColor?: string; border?: any }>>>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionStartCell, setSelectionStartCell] = useState<string | null>(null);
  const [currentMappingField, setCurrentMappingField] = useState<string | null>(null);
  const [currentDateOption, setCurrentDateOption] = useState<'month' | 'day' | null>(null);
  const [currentAmountOption, setCurrentAmountOption] = useState<'income' | 'expense' | null>(null);
  const [currentPeriodOption, setCurrentPeriodOption] = useState<'start' | 'end' | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const excelPreviewRef = useRef<HTMLDivElement>(null);

  // 증빙 문서 정보 수집
  React.useEffect(() => {
    if (isOpen && entries.length > 0) {
      const evidenceEntries = entries
        .filter(entry => entry.evidenceFileId && entry.evidenceFileName)
        .map(entry => ({
          entryId: entry.entryId,
          description: entry.description,
          fileName: entry.evidenceFileName || '',
          fileId: entry.evidenceFileId || ''
        }));
      setEvidenceInfo(evidenceEntries);
    }
  }, [isOpen, entries]);

  // 템플릿에서 양식 선택
  const handleSelectTemplate = async (template: Template) => {
    try {
      setIsLoadingTemplate(true);
      setError(null);

      if (!template.documentId) {
        setError('템플릿 ID가 없습니다.');
        setIsLoadingTemplate(false);
        return;
      }

      // Google API 초기화
      await initializeGoogleAPIOnce();
      const gapi = (window as any).gapi;
      if (!gapi?.client?.sheets) {
        throw new Error('Google Sheets API가 초기화되지 않았습니다.');
      }

      setSelectedTemplate(template);
      setTemplateSpreadsheetId(template.documentId);

      // 시트 목록 가져오기
      const spreadsheetResponse = await (gapi.client as any).sheets.spreadsheets.get({
        spreadsheetId: template.documentId,
        fields: 'sheets.properties(title,sheetId)'
      });

      const sheets = spreadsheetResponse.result.sheets || [];
      const sheetNamesList = sheets.map((s: any) => s.properties.title);
      setSheetNames(sheetNamesList);
      
      if (sheetNamesList.length > 0) {
        setSelectedSheet(sheetNamesList[0]);
        await loadSheetData(template.documentId, sheetNamesList[0]);
      }

    } catch (err: any) {
      console.error('템플릿 파일 선택 오류:', err);
      setError(err.message || '템플릿에서 양식을 불러올 수 없습니다.');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const [sheetHtml, setSheetHtml] = useState<string>('');

  const loadSheetData = async (spreadsheetId: string, sheetName: string) => {
    try {
      await initializeGoogleAPIOnce();
      const gapi = (window as any).gapi;
      if (!gapi?.client?.sheets) {
        throw new Error('Google Sheets API가 초기화되지 않았습니다.');
      }

      // 시트 ID 찾기
      const spreadsheetResponse = await (gapi.client as any).sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: 'sheets.properties(title,sheetId)'
      });

      const sheet = spreadsheetResponse.result.sheets?.find((s: any) => s.properties.title === sheetName);
      if (!sheet) {
        throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
      }

      const sheetId = sheet.properties.sheetId;

      // 시트 데이터 가져오기 (값 + 스타일)
      const dataResponse = await (gapi.client as any).sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        ranges: [`${sheetName}!A1:ZZ1000`], // 충분히 큰 범위
        includeGridData: true,
        fields: 'sheets.data.rowData.values(effectiveValue,formattedValue,userEnteredFormat(backgroundColor,textFormat,numberFormat))'
      });

      const rowData = dataResponse.result.sheets?.[0]?.data?.[0]?.rowData || [];
      
      // 데이터 배열로 변환
      const data: Array<Array<{ value: any; formattedValue?: string; backgroundColor?: string; textColor?: string }>> = [];
      let maxCols = 0;

      rowData.forEach((row: any) => {
        const rowArray: Array<{ value: any; formattedValue?: string; backgroundColor?: string; textColor?: string }> = [];
        if (row.values) {
          row.values.forEach((cell: any) => {
            const value = cell.effectiveValue;
            let cellValue: any = '';
            if (value) {
              if (value.numberValue !== undefined) {
                cellValue = value.numberValue;
              } else if (value.stringValue !== undefined) {
                cellValue = value.stringValue;
              } else if (value.boolValue !== undefined) {
                cellValue = value.boolValue;
              }
            }
            
            const bgColor = cell.userEnteredFormat?.backgroundColor;
            const textColor = cell.userEnteredFormat?.textFormat?.foregroundColor;
            
            rowArray.push({
              value: cellValue,
              formattedValue: cell.formattedValue || String(cellValue),
              backgroundColor: bgColor ? `rgb(${bgColor.red || 0}, ${bgColor.green || 0}, ${bgColor.blue || 0})` : undefined,
              textColor: textColor ? `rgb(${textColor.red || 0}, ${textColor.green || 0}, ${textColor.blue || 0})` : undefined
            });
          });
          maxCols = Math.max(maxCols, rowArray.length);
        }
        data.push(rowArray);
      });

      setSheetData(data);

      // HTML 테이블 생성
      const doc = document.implementation.createHTMLDocument();
      const table = doc.createElement('table');
      table.className = 'excel-preview-table';
      table.style.cssText = 'border-collapse: separate; border-spacing: 0; width: 100%; font-size: 11px; font-family: "Segoe UI", "Calibri", "Arial", sans-serif; background: #ffffff;';

      // 헤더 행 추가
      const headerRow = doc.createElement('thead');
      const headerTr = doc.createElement('tr');
      
      const emptyHeader = doc.createElement('th');
      emptyHeader.className = 'excel-row-header excel-col-header';
      emptyHeader.style.cssText = 'background: #f2f2f2; border: 1px solid #d0d7e5; text-align: center; font-weight: 600; color: #606060; min-width: 40px; width: 40px; position: sticky; left: 0; top: 0; z-index: 9;';
      headerTr.appendChild(emptyHeader);
      
      for (let i = 0; i < Math.max(maxCols, 10); i++) {
        const colHeader = doc.createElement('th');
        colHeader.className = 'excel-col-header';
        colHeader.textContent = String.fromCharCode(65 + (i % 26)) + (i >= 26 ? String.fromCharCode(64 + Math.floor(i / 26)) : ''); // A, B, C... Z, AA, AB...
        colHeader.style.cssText = 'background: #f2f2f2; border: 1px solid #d0d7e5; text-align: center; font-weight: 600; color: #606060; min-width: 64px; width: 64px; position: sticky; top: 0; z-index: 7;';
        headerTr.appendChild(colHeader);
      }
      
      headerRow.appendChild(headerTr);
      table.appendChild(headerRow);

      // 데이터 행 추가
      const tbody = doc.createElement('tbody');
      data.forEach((row, rowIndex) => {
        const tr = doc.createElement('tr');
        
        // 행 헤더
        const rowHeader = doc.createElement('td');
        rowHeader.className = 'excel-row-header';
        rowHeader.textContent = String(rowIndex + 1);
        rowHeader.style.cssText = 'background: #f2f2f2; border: 1px solid #d0d7e5; text-align: center; font-weight: 600; color: #606060; min-width: 40px; width: 40px; position: sticky; left: 0; z-index: 6;';
        tr.appendChild(rowHeader);
        
        // 데이터 셀
        for (let colIndex = 0; colIndex < Math.max(row.length, maxCols); colIndex++) {
          const td = doc.createElement('td');
          td.className = 'selectable';
          td.dataset.row = String(rowIndex);
          td.dataset.col = String(colIndex);
          
          const cell = row[colIndex];
          if (cell) {
            td.textContent = cell.formattedValue || String(cell.value || '');
            if (cell.backgroundColor) {
              td.style.backgroundColor = cell.backgroundColor;
            }
            if (cell.textColor) {
              td.style.color = cell.textColor;
            }
          }
          
          td.style.cssText = 'border: 1px solid #d0d7e5; padding: 2px 4px; text-align: left; vertical-align: middle; min-width: 64px; width: 64px; height: 20px; background: ' + (rowIndex % 2 === 0 ? '#ffffff' : '#fafafa') + '; color: #000000; font-weight: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box;';
          tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      setSheetHtml(table.outerHTML);
    } catch (err: any) {
      console.error('시트 데이터 로드 오류:', err);
      setError(err.message || '시트 데이터를 불러올 수 없습니다.');
    }
  };

  const handleFieldMappingChange = (index: number, cellRange: string) => {
    const newMappings = [...fieldMappings];
    newMappings[index].cellRange = cellRange;
    setFieldMappings(newMappings);
  };

  const handleFieldToggle = (index: number) => {
    const newMappings = [...fieldMappings];
    newMappings[index].enabled = !newMappings[index].enabled;
    if (!newMappings[index].enabled) {
      newMappings[index].cellRange = '';
      setSelectedCells(new Set());
      setSelectionStartCell(null);
      setCurrentMappingField(null);
    } else {
      setCurrentMappingField(newMappings[index].field);
      setSelectedCells(new Set());
      setSelectionStartCell(null);
    }
    setFieldMappings(newMappings);
  };

  const getCellAddress = (row: number, col: number): string => {
    const colLetter = String.fromCharCode(65 + col); // A=0, B=1, ...
    return `${colLetter}${row + 1}`;
  };

  // rowColToCell은 getCellAddress의 별칭 (하위 호환성)
  const rowColToCell = getCellAddress;


  React.useEffect(() => {
    if (selectedSheet && templateSpreadsheetId) {
      loadSheetData(templateSpreadsheetId, selectedSheet);
    }
  }, [selectedSheet, templateSpreadsheetId]);

  // 엑셀 HTML 테이블에 이벤트 리스너 추가 및 스타일 업데이트
  React.useEffect(() => {
    if (!excelPreviewRef.current || !sheetHtml) return;

    const table = excelPreviewRef.current.querySelector('table');
    if (!table) return;

    const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'TD' || target.tagName === 'TH') {
          const cell = target as HTMLTableCellElement;
          const row = (cell.parentElement as HTMLTableRowElement)?.rowIndex;
          const col = cell.cellIndex;
        
        if (row !== undefined && col !== undefined && (currentMappingField || currentDateOption || currentAmountOption || currentPeriodOption)) {
          // 헤더 행/열 제외
          const actualRow = row - 1;
          const actualCol = col - 1;
          
          if (actualRow >= 0 && actualCol >= 0) {
            const cellAddr = getCellAddress(actualRow, actualCol);
            
            // 더블 클릭 방식: 첫 번째 클릭은 시작 셀, 두 번째 클릭은 끝 셀
            if (!selectionStartCell) {
              // 첫 번째 클릭: 시작 셀 선택
              setSelectionStartCell(cellAddr);
              setSelectedCells(new Set([cellAddr]));
            } else {
              // 두 번째 클릭: 끝 셀 선택하고 영역 확정
              const startAddr = selectionStartCell;
              const endAddr = cellAddr;
              
              // 셀 주소를 행/열로 변환
              const parseCellAddr = (addr: string): { row: number; col: number } => {
                const match = addr.match(/^([A-Z]+)(\d+)$/);
                if (!match) return { row: 0, col: 0 };
                const colStr = match[1];
                const rowNum = parseInt(match[2], 10) - 1;
                let colNum = 0;
                for (let i = 0; i < colStr.length; i++) {
                  colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
                }
                colNum -= 1; // A=0으로 변환
                return { row: rowNum, col: colNum };
              };
              
              const start = parseCellAddr(startAddr);
              const end = parseCellAddr(endAddr);
              
              const startRow = Math.min(start.row, end.row);
              const endRow = Math.max(start.row, end.row);
              const startCol = Math.min(start.col, end.col);
              const endCol = Math.max(start.col, end.col);
              
              const cells = new Set<string>();
              for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                  cells.add(getCellAddress(r, c));
                }
              }
              setSelectedCells(cells);
              
              // 선택된 범위를 "시작셀:끝셀" 형식으로 저장
              // 이미 startRow, endRow, startCol, endCol이 올바르게 계산되어 있으므로 이를 사용
              const startCell = getCellAddress(startRow, startCol);
              const endCell = getCellAddress(endRow, endCol);
              const cellRange = startRow === endRow && startCol === endCol 
                ? startCell 
                : `${startCell}:${endCell}`;
              
              if (currentMappingField) {
                const index = fieldMappings.findIndex(m => m.field === currentMappingField);
                if (index !== -1) {
                  const newMappings = [...fieldMappings];
                  newMappings[index].cellRange = cellRange;
                  setFieldMappings(newMappings);
                  setCurrentMappingField(null);
                }
              } else if (currentDateOption) {
                if (currentDateOption === 'month') {
                  setDateOptions({ ...dateOptions, monthCell: cellRange });
                } else if (currentDateOption === 'day') {
                  setDateOptions({ ...dateOptions, dayCell: cellRange });
                }
                setCurrentDateOption(null);
              } else if (currentAmountOption) {
                if (currentAmountOption === 'income') {
                  setAmountOptions({ ...amountOptions, incomeCell: cellRange });
                } else if (currentAmountOption === 'expense') {
                  setAmountOptions({ ...amountOptions, expenseCell: cellRange });
                }
                setCurrentAmountOption(null);
              } else if (currentPeriodOption) {
                if (periodOptions.sameCell) {
                  setPeriodOptions({ ...periodOptions, dateCell: cellRange });
                } else {
                  if (currentPeriodOption === 'start') {
                    setPeriodOptions({ ...periodOptions, startDateCell: cellRange });
                  } else if (currentPeriodOption === 'end') {
                    setPeriodOptions({ ...periodOptions, endDateCell: cellRange });
                  }
                }
                setCurrentPeriodOption(null);
              }
              
              // 선택 완료 후 초기화
              setSelectionStartCell(null);
            }
          }
        }
      }
    };


    const updateCellStyles = () => {
      const cells = table.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLTableCellElement;
        const row = (cellElement.parentElement as HTMLTableRowElement)?.rowIndex;
        const col = cellElement.cellIndex;
        if (row !== undefined && col !== undefined) {
          const cellAddr = getCellAddress(row - 1, col - 1);
          const isSelected = selectedCells.has(cellAddr);
          const isActive = !!(currentMappingField && fieldMappings.find(m => m.field === currentMappingField)?.enabled) 
            || !!currentDateOption 
            || !!currentAmountOption
            || !!currentPeriodOption;
          
          cellElement.classList.toggle('selected', isSelected);
          cellElement.classList.toggle('selectable', isActive);
        }
      });
    };

    table.addEventListener('click', handleClick);
    
    // 초기 스타일 적용 및 주기적 업데이트
    updateCellStyles();
    const intervalId = setInterval(updateCellStyles, 100);

    return () => {
      table.removeEventListener('click', handleClick);
      clearInterval(intervalId);
    };
  }, [sheetHtml, selectedCells, selectionStartCell, currentMappingField, currentDateOption, currentAmountOption, currentPeriodOption, fieldMappings, dateOptions, amountOptions, periodOptions]);

  // 월별 그룹화 함수
  const formatMonthKey = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const formatMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  const groupEntriesByMonth = (entries: LedgerEntry[]): Record<string, LedgerEntry[]> => {
    return entries.reduce((acc, entry) => {
      const monthKey = formatMonthKey(entry.date);
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(entry);
      return acc;
    }, {} as Record<string, LedgerEntry[]>);
  };

  // Google Sheets에 데이터 작성 함수
  const writeEntriesToGoogleSheet = async (
    spreadsheetId: string,
    sheetName: string,
    entriesToWrite: LedgerEntry[],
    enabledMappings: FieldMapping[],
    dateOptions: DateOptions,
    amountOptions: AmountOptions,
    periodOptions?: PeriodOptions,
    exportMode?: 'all' | 'monthly'
  ) => {
    await initializeGoogleAPIOnce();
    const gapi = (window as any).gapi;
    if (!gapi?.client?.sheets) {
      throw new Error('Google Sheets API가 초기화되지 않았습니다.');
    }

    // 셀 범위 파싱 함수
    const parseCellRange = (range: string): { startRow: number; endRow: number; startCol: number; endCol: number } => {
      const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
      if (rangeMatch) {
        const startColStr = rangeMatch[1];
        const startRow = parseInt(rangeMatch[2], 10) - 1;
        const endColStr = rangeMatch[3];
        const endRow = parseInt(rangeMatch[4], 10) - 1;
        
        const colStrToNum = (colStr: string): number => {
          let colNum = 0;
          for (let i = 0; i < colStr.length; i++) {
            colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
          }
          return colNum - 1;
        };
        
        return {
          startRow: Math.min(startRow, endRow),
          endRow: Math.max(startRow, endRow),
          startCol: Math.min(colStrToNum(startColStr), colStrToNum(endColStr)),
          endCol: Math.max(colStrToNum(startColStr), colStrToNum(endColStr))
        };
      }
      
      const singleMatch = range.match(/^([A-Z]+)(\d+)$/);
      if (singleMatch) {
        const colStr = singleMatch[1];
        const row = parseInt(singleMatch[2], 10) - 1;
        const colStrToNum = (colStr: string): number => {
          let colNum = 0;
          for (let i = 0; i < colStr.length; i++) {
            colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
          }
          return colNum - 1;
        };
        const col = colStrToNum(colStr);
        return { startRow: row, endRow: row, startCol: col, endCol: col };
      }
      
      throw new Error(`잘못된 셀 범위 형식: ${range}`);
    };

    // 셀 주소를 A1 형식으로 변환
    const getCellAddress = (row: number, col: number): string => {
      let colStr = '';
      let colNum = col + 1;
      while (colNum > 0) {
        colNum--;
        colStr = String.fromCharCode(65 + (colNum % 26)) + colStr;
        colNum = Math.floor(colNum / 26);
      }
      return `${colStr}${row + 1}`;
    };

    // 배치 업데이트를 위한 데이터 수집
    const data: Array<{ range: string; values: any[][] }> = [];
    const monthKey = exportMode === 'monthly' ? formatMonthKey(entriesToWrite[0]?.date || '') : undefined;

    // 사용기간 날짜 작성 (월별 모드일 때만)
    if (periodOptions && periodOptions.enabled && monthKey) {
      const [year, month] = monthKey.split('-');
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);
      
      const formatDate = (date: Date, format: string): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return format.replace('YYYY', String(y)).replace('MM', m).replace('DD', d);
      };
      
      const startDateStr = formatDate(startDate, periodOptions.dateFormat);
      const endDateStr = formatDate(endDate, periodOptions.dateFormat);
      
      if (periodOptions.sameCell && periodOptions.dateCell) {
        const range = parseCellRange(periodOptions.dateCell);
        const cellAddr = getCellAddress(range.startRow, range.startCol);
        data.push({
          range: `${sheetName}!${cellAddr}`,
          values: [[`${startDateStr} ~ ${endDateStr}`]]
        });
      } else {
        if (periodOptions.startDateCell) {
          const range = parseCellRange(periodOptions.startDateCell);
          const cellAddr = getCellAddress(range.startRow, range.startCol);
          data.push({
            range: `${sheetName}!${cellAddr}`,
            values: [[startDateStr]]
          });
        }
        if (periodOptions.endDateCell) {
          const range = parseCellRange(periodOptions.endDateCell);
          const cellAddr = getCellAddress(range.startRow, range.startCol);
          data.push({
            range: `${sheetName}!${cellAddr}`,
            values: [[endDateStr]]
          });
        }
      }
    }

    // 각 항목을 Google Sheets에 작성
    entriesToWrite.forEach((entry, index) => {
      enabledMappings.forEach(mapping => {
        const range = parseCellRange(mapping.cellRange);
        const targetRow = range.startRow + index;
        const targetCol = range.startCol;

        let value: string | number = '';

        switch (mapping.field) {
          case 'date':
            if (dateOptions.separateMonthDay) {
              const date = new Date(entry.date);
              const month = date.getMonth() + 1;
              const day = date.getDate();
              
              if (dateOptions.monthCell) {
                const monthRange = parseCellRange(dateOptions.monthCell);
                const monthRow = monthRange.startRow + index;
                const monthCellAddr = getCellAddress(monthRow, monthRange.startCol);
                data.push({
                  range: `${sheetName}!${monthCellAddr}`,
                  values: [[month]]
                });
              }
              
              if (dateOptions.dayCell) {
                const dayRange = parseCellRange(dateOptions.dayCell);
                const dayRow = dayRange.startRow + index;
                const dayCellAddr = getCellAddress(dayRow, dayRange.startCol);
                data.push({
                  range: `${sheetName}!${dayCellAddr}`,
                  values: [[day]]
                });
              }
              return;
            } else {
              const date = new Date(entry.date);
              value = `${date.getMonth() + 1}/${date.getDate()}`;
            }
            break;

          case 'category':
            value = entry.category;
            break;

          case 'description':
            value = entry.description;
            break;

          case 'amount':
            if (amountOptions.separateIncomeExpense) {
              if (amountOptions.incomeCell) {
                const incomeRange = parseCellRange(amountOptions.incomeCell);
                const incomeRow = incomeRange.startRow + index;
                const incomeCellAddr = getCellAddress(incomeRow, incomeRange.startCol);
                const incomeValue = entry.transactionType === 'income' ? Math.abs(entry.amount) : '';
                data.push({
                  range: `${sheetName}!${incomeCellAddr}`,
                  values: [[incomeValue]]
                });
              }
              if (amountOptions.expenseCell) {
                const expenseRange = parseCellRange(amountOptions.expenseCell);
                const expenseRow = expenseRange.startRow + index;
                const expenseCellAddr = getCellAddress(expenseRow, expenseRange.startCol);
                const expenseValue = entry.transactionType === 'expense' ? Math.abs(entry.amount) : '';
                data.push({
                  range: `${sheetName}!${expenseCellAddr}`,
                  values: [[expenseValue]]
                });
              }
              return;
            } else {
              value = entry.amount;
            }
            break;

          case 'source':
            value = entry.source;
            break;

          case 'balanceAfter':
            value = entry.balanceAfter;
            break;

          case 'usagePeriod':
            const entryDate = new Date(entry.date);
            const entryYear = entryDate.getFullYear();
            const entryMonth = entryDate.getMonth() + 1;
            const startDate = new Date(entryYear, entryMonth - 1, 1);
            const endDate = new Date(entryYear, entryMonth, 0);
            value = `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${String(startDate.getDate()).padStart(2, '0')}.~${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}.`;
            break;
        }

        if (value !== '') {
          const cellAddr = getCellAddress(targetRow, targetCol);
          data.push({
            range: `${sheetName}!${cellAddr}`,
            values: [[value]]
          });
        }
      });
    });

    // 배치 업데이트 실행
    if (data.length > 0) {
      await (gapi.client as any).sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: data
        }
      });
    }
  };

  const handleExport = async () => {
    if (!templateSpreadsheetId || !selectedSheet) {
      setError('템플릿과 시트를 선택해주세요.');
      return;
    }

    const enabledMappings = fieldMappings.filter(m => m.enabled && m.cellRange);
    if (enabledMappings.length === 0) {
      setError('최소 하나의 필드를 매핑해주세요.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await initializeGoogleAPIOnce();
      const gapi = (window as any).gapi;
      if (!gapi?.client?.sheets) {
        throw new Error('Google Sheets API가 초기화되지 않았습니다.');
      }

      // 날짜 순으로 정렬 (오름차순)
      const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      // 템플릿을 복사하여 새 스프레드시트 생성 (원본 보존)
      const token = (gapi.client as any).getToken();
      if (!token || !token.access_token) {
        throw new Error('Google 인증 토큰이 없습니다. 다시 로그인해주세요.');
      }

      // 템플릿 복사
      const copyResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${templateSpreadsheetId}/copy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `장부_내보내기_${new Date().toISOString().split('T')[0]}`
          })
        }
      );

      if (!copyResponse.ok) {
        throw new Error(`템플릿 복사 실패: ${copyResponse.status} ${copyResponse.statusText}`);
      }

      const copiedSpreadsheet = await copyResponse.json();
      const newSpreadsheetId = copiedSpreadsheet.id;

      try {
        if (exportMode === 'all') {
          // 전체를 한 시트에 내보내기
          await writeEntriesToGoogleSheet(
            newSpreadsheetId,
            selectedSheet,
            sortedEntries,
            enabledMappings,
            dateOptions,
            amountOptions,
            undefined,
            'all'
          );
        } else {
          // 월별로 시트 분리
          const groupedEntries = groupEntriesByMonth(sortedEntries);
          const sortedMonths = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

          // 시트 목록 가져오기
          const spreadsheetResponse = await (gapi.client as any).sheets.spreadsheets.get({
            spreadsheetId: newSpreadsheetId,
            fields: 'sheets.properties(title,sheetId)'
          });

          for (const monthKey of sortedMonths) {
            const monthEntries = groupedEntries[monthKey].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateA - dateB;
            });
            const monthLabel = formatMonthLabel(monthKey);
            
            // 새 시트 복사
            const sourceSheet = spreadsheetResponse.result.sheets?.find((s: any) => s.properties.title === selectedSheet);
            if (sourceSheet) {
              await (gapi.client as any).sheets.spreadsheets.batchUpdate({
                spreadsheetId: newSpreadsheetId,
                resource: {
                  requests: [{
                    duplicateSheet: {
                      sourceSheetId: sourceSheet.properties.sheetId,
                      newSheetName: monthLabel
                    }
                  }]
                }
              });
            }

            // 새 시트에 데이터 작성
            await writeEntriesToGoogleSheet(
              newSpreadsheetId,
              monthLabel,
              monthEntries,
              enabledMappings,
              dateOptions,
              amountOptions,
              periodOptions,
              'monthly'
            );
          }
        }

        // 엑셀 형식으로 내보내기
        const exportResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${newSpreadsheetId}/export?mimeType=${encodeURIComponent('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.access_token}`
            }
          }
        );

        if (!exportResponse.ok) {
          throw new Error(`엑셀 내보내기 실패: ${exportResponse.status} ${exportResponse.statusText}`);
        }

        const blob = await exportResponse.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const fileName = exportMode === 'all' 
          ? `장부_내보내기_${new Date().toISOString().split('T')[0]}.xlsx`
          : `장부_내보내기_월별_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = fileName;
        link.click();

        // 임시 복사본 삭제 (선택사항)
        // await fetch(`https://www.googleapis.com/drive/v3/files/${newSpreadsheetId}`, {
        //   method: 'DELETE',
        //   headers: { 'Authorization': `Bearer ${token.access_token}` }
        // });

        onClose();
      } catch (err) {
        // 오류 발생 시 복사본 삭제
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${newSpreadsheetId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token.access_token}` }
          });
        } catch {}
        throw err;
      }
    } catch (err: any) {
      console.error('내보내기 오류:', err);
      setError(err.message || '내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fieldLabels: { [key: string]: string } = {
    date: '날짜',
    category: '카테고리',
    description: '내용',
    amount: '금액',
    source: '출처',
    balanceAfter: '잔액',
    usagePeriod: '사용기간'
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accounting-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>장부 내보내기</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', padding: '20px' }}>
          {/* 왼쪽: 설정창 */}
          <div style={{ flex: '0 0 50%', overflowY: 'auto', paddingRight: '10px' }}>
            {/* 기본 설정 섹션 */}
            <div className="export-settings-section">
              <h3 className="export-section-title">기본 설정</h3>
              
              <div className="form-group">
                <label htmlFor="excel-file">
                  엑셀 양식 파일 <span className="required">*</span>
                </label>
                
                {/* 템플릿 선택 */}
                {excelTemplates.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>
                      템플릿에서 선택
                    </label>
                    <select
                      value={selectedTemplate?.documentId || ''}
                      onChange={(e) => {
                        const template = excelTemplates.find(t => t.documentId === e.target.value);
                        if (template) {
                          handleSelectTemplate(template);
                        }
                      }}
                      className="form-input"
                      disabled={isLoadingTemplate || isLoadingTemplates}
                    >
                      <option value="">템플릿 선택...</option>
                      {allDefaultTemplates.filter(t => 
                        t.mimeType === 'application/vnd.google-apps.spreadsheet' || !t.mimeType
                      ).length > 0 && (
                        <optgroup label="기본 템플릿">
                          {allDefaultTemplates
                            .filter(t => t.mimeType === 'application/vnd.google-apps.spreadsheet' || !t.mimeType)
                            .map(template => (
                              <option key={template.documentId} value={template.documentId}>
                                {template.title}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {personalTemplates.filter(t => 
                        t.mimeType === 'application/vnd.google-apps.spreadsheet' || !t.mimeType
                      ).length > 0 && (
                        <optgroup label="개인 템플릿">
                          {personalTemplates
                            .filter(t => t.mimeType === 'application/vnd.google-apps.spreadsheet' || !t.mimeType)
                            .map(template => (
                              <option key={template.documentId} value={template.documentId}>
                                {template.title}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
                
                {/* 선택된 템플릿 표시 */}
                {selectedTemplate && (
                  <p className="form-hint" style={{ color: 'var(--accounting-primary)', marginTop: '8px' }}>
                    ✓ {selectedTemplate.title} {selectedTemplate.isPersonal ? '(개인 템플릿)' : '(기본 템플릿)'}
                  </p>
                )}
                {!selectedTemplate && (
                  <p className="form-hint" style={{ marginTop: '8px' }}>
                    템플릿을 선택해주세요.
                  </p>
                )}
              </div>

              {sheetNames.length > 0 && (
                <div className="form-group">
                  <label htmlFor="sheet-select">시트 선택</label>
                  <select
                    id="sheet-select"
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(e.target.value);
                      if (templateSpreadsheetId) {
                        loadSheetData(templateSpreadsheetId, e.target.value);
                      }
                    }}
                    className="form-input"
                  >
                    {sheetNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {templateSpreadsheetId && (
                <div className="form-group">
                  <label>내보내기 방식</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="export-mode"
                        value="all"
                        checked={exportMode === 'all'}
                        onChange={(e) => setExportMode(e.target.value as 'all' | 'monthly')}
                      />
                      <span>전체 내보내기</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="export-mode"
                        value="monthly"
                        checked={exportMode === 'monthly'}
                        onChange={(e) => setExportMode(e.target.value as 'all' | 'monthly')}
                      />
                      <span>월별 시트 분리</span>
                    </label>
                  </div>
                  <p className="form-hint">
                    {exportMode === 'all' 
                      ? '모든 장부 항목을 하나의 시트에 내보냅니다.'
                      : '각 월별로 별도의 시트를 생성하여 같은 파일에 저장합니다.'}
                  </p>
                </div>
              )}
            </div>

            {/* 필드 매핑 섹션 */}
            {templateSpreadsheetId && (
              <div className="export-settings-section">
                <h3 className="export-section-title">필드 매핑</h3>
                <p className="section-description">내보낼 필드를 선택하고 엑셀 미리보기에서 데이터 영역을 두 번 클릭하여 선택하세요.</p>
                
                <div className="field-mapping-grid">
                  {fieldMappings.map((mapping, index) => {
                    // 사용기간은 월별 모드일 때만 표시
                    if (mapping.field === 'usagePeriod' && exportMode !== 'monthly') {
                      return null;
                    }
                    return (
                      <div key={mapping.field} className="field-mapping-item-compact">
                        <label className="field-mapping-checkbox-compact">
                          <input
                            type="checkbox"
                            checked={mapping.enabled}
                            onChange={() => handleFieldToggle(index)}
                          />
                          <span className="field-label">{fieldLabels[mapping.field]}</span>
                        </label>
                        {mapping.enabled && (
                          <div className="field-mapping-controls">
                            {currentMappingField === mapping.field ? (
                              <span className="selection-status">선택 중...</span>
                            ) : mapping.cellRange ? (
                              <span className="cell-range-badge">{mapping.cellRange}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentMappingField(mapping.field);
                                  setCurrentDateOption(null);
                                  setCurrentAmountOption(null);
                                  setCurrentPeriodOption(null);
                                  setSelectedCells(new Set());
                                  setSelectionStartCell(null);
                                }}
                                className="btn-secondary btn-tiny"
                              >
                                셀 선택
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {currentMappingField && (
                  <div className="selection-hint" style={{ marginTop: '12px' }}>
                    💡 엑셀 미리보기에서 <strong>{fieldLabels[currentMappingField]}</strong> 영역을 두 번 클릭하세요.
                  </div>
                )}
              </div>
            )}


            {/* 고급 옵션 섹션 */}
            {templateSpreadsheetId && (
              <div className="export-settings-section">
                <h3 className="export-section-title">고급 옵션</h3>
                
                {/* 날짜 옵션 */}
                <div className="option-group">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={dateOptions.separateMonthDay}
                      onChange={(e) => {
                        setDateOptions({
                          ...dateOptions,
                          separateMonthDay: e.target.checked
                        });
                        if (!e.target.checked) {
                          setCurrentDateOption(null);
                          setSelectedCells(new Set());
                        }
                      }}
                    />
                    <span>날짜를 월/일로 분리</span>
                  </label>
                  {dateOptions.separateMonthDay && (
                    <div className="option-details">
                      <div className="cell-selector-row">
                        <div className="cell-selector">
                          <label>월 셀</label>
                          <div className="cell-selector-controls">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDateOption('month');
                                setCurrentMappingField(null);
                                setCurrentAmountOption(null);
                                setSelectedCells(new Set());
                              }}
                              className={currentDateOption === 'month' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                            >
                              {selectionStartCell && currentDateOption === 'month' ? '끝 셀 선택' : currentDateOption === 'month' ? '시작 셀 선택' : '셀 선택'}
                            </button>
                            {dateOptions.monthCell && (
                              <span className="cell-range-display">{dateOptions.monthCell}</span>
                            )}
                          </div>
                        </div>
                        <div className="cell-selector">
                          <label>일 셀</label>
                          <div className="cell-selector-controls">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDateOption('day');
                                setCurrentMappingField(null);
                                setCurrentAmountOption(null);
                                setSelectedCells(new Set());
                              }}
                              className={currentDateOption === 'day' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                            >
                              {selectionStartCell && currentDateOption === 'day' ? '끝 셀 선택' : currentDateOption === 'day' ? '시작 셀 선택' : '셀 선택'}
                            </button>
                            {dateOptions.dayCell && (
                              <span className="cell-range-display">{dateOptions.dayCell}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {currentDateOption && (
                        <div className="selection-hint">
                          💡 엑셀 미리보기에서 영역을 두 번 클릭하세요.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 금액 옵션 */}
                <div className="option-group">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={amountOptions.separateIncomeExpense}
                      onChange={(e) => {
                        setAmountOptions({
                          ...amountOptions,
                          separateIncomeExpense: e.target.checked
                        });
                        if (!e.target.checked) {
                          setCurrentAmountOption(null);
                          setSelectedCells(new Set());
                        }
                      }}
                    />
                    <span>금액을 지출/수입으로 분리</span>
                  </label>
                  {amountOptions.separateIncomeExpense && (
                    <div className="option-details">
                      <div className="cell-selector-row">
                        <div className="cell-selector">
                          <label>수입 셀</label>
                          <div className="cell-selector-controls">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentAmountOption('income');
                                setCurrentMappingField(null);
                                setCurrentDateOption(null);
                                setSelectedCells(new Set());
                              }}
                              className={currentAmountOption === 'income' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                            >
                              {selectionStartCell && currentAmountOption === 'income' ? '끝 셀 선택' : currentAmountOption === 'income' ? '시작 셀 선택' : '셀 선택'}
                            </button>
                            {amountOptions.incomeCell && (
                              <span className="cell-range-display">{amountOptions.incomeCell}</span>
                            )}
                          </div>
                        </div>
                        <div className="cell-selector">
                          <label>지출 셀</label>
                          <div className="cell-selector-controls">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentAmountOption('expense');
                                setCurrentMappingField(null);
                                setCurrentDateOption(null);
                                setSelectedCells(new Set());
                              }}
                              className={currentAmountOption === 'expense' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                            >
                              {selectionStartCell && currentAmountOption === 'expense' ? '끝 셀 선택' : currentAmountOption === 'expense' ? '시작 셀 선택' : '셀 선택'}
                            </button>
                            {amountOptions.expenseCell && (
                              <span className="cell-range-display">{amountOptions.expenseCell}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {currentAmountOption && (
                        <div className="selection-hint">
                          💡 엑셀 미리보기에서 영역을 두 번 클릭하세요.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 사용기간 옵션 (월별 모드일 때만) */}
                {exportMode === 'monthly' && (
                  <div className="option-group">
                    <label className="option-checkbox">
                      <input
                        type="checkbox"
                        checked={periodOptions.enabled}
                        onChange={(e) => {
                          setPeriodOptions({
                            ...periodOptions,
                            enabled: e.target.checked
                          });
                          if (!e.target.checked) {
                            setCurrentPeriodOption(null);
                            setSelectedCells(new Set());
                          }
                        }}
                      />
                      <span>사용기간 날짜 자동 입력</span>
                    </label>
                    {periodOptions.enabled && (
                      <div className="option-details">
                        <div className="radio-group" style={{ marginBottom: '12px' }}>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="period-cell-mode"
                              checked={periodOptions.sameCell}
                              onChange={(e) => {
                                setPeriodOptions({
                                  ...periodOptions,
                                  sameCell: true,
                                  startDateCell: undefined,
                                  endDateCell: undefined
                                });
                                setCurrentPeriodOption(null);
                                setSelectedCells(new Set());
                              }}
                            />
                            <span>같은 셀 (시작일 ~ 종료일)</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name="period-cell-mode"
                              checked={!periodOptions.sameCell}
                              onChange={(e) => {
                                setPeriodOptions({
                                  ...periodOptions,
                                  sameCell: false,
                                  dateCell: undefined
                                });
                                setCurrentPeriodOption(null);
                                setSelectedCells(new Set());
                              }}
                            />
                            <span>다른 셀 (시작일, 종료일 분리)</span>
                          </label>
                        </div>

                        {periodOptions.sameCell ? (
                          <div className="cell-selector">
                            <label>날짜 셀</label>
                            <div className="cell-selector-controls">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentPeriodOption('start');
                                  setCurrentMappingField(null);
                                  setCurrentDateOption(null);
                                  setCurrentAmountOption(null);
                                  setSelectedCells(new Set());
                                }}
                                className={currentPeriodOption === 'start' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                              >
                                {selectionStartCell && currentPeriodOption === 'start' ? '끝 셀 선택' : currentPeriodOption === 'start' ? '시작 셀 선택' : '셀 선택'}
                              </button>
                              {periodOptions.dateCell && (
                                <span className="cell-range-display">{periodOptions.dateCell}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="cell-selector-row">
                            <div className="cell-selector">
                              <label>시작일 셀</label>
                              <div className="cell-selector-controls">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPeriodOption('start');
                                    setCurrentMappingField(null);
                                    setCurrentDateOption(null);
                                    setCurrentAmountOption(null);
                                    setSelectedCells(new Set());
                                  }}
                                  className={currentPeriodOption === 'start' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                                >
                                  {selectionStartCell && currentPeriodOption === 'start' ? '끝 셀 선택' : currentPeriodOption === 'start' ? '시작 셀 선택' : '셀 선택'}
                                </button>
                                {periodOptions.startDateCell && (
                                  <span className="cell-range-display">{periodOptions.startDateCell}</span>
                                )}
                              </div>
                            </div>
                            <div className="cell-selector">
                              <label>종료일 셀</label>
                              <div className="cell-selector-controls">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPeriodOption('end');
                                    setCurrentMappingField(null);
                                    setCurrentDateOption(null);
                                    setCurrentAmountOption(null);
                                    setSelectedCells(new Set());
                                  }}
                                  className={currentPeriodOption === 'end' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                                >
                                  {selectionStartCell && currentPeriodOption === 'end' ? '끝 셀 선택' : currentPeriodOption === 'end' ? '시작 셀 선택' : '셀 선택'}
                                </button>
                                {periodOptions.endDateCell && (
                                  <span className="cell-range-display">{periodOptions.endDateCell}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {currentPeriodOption && (
                          <div className="selection-hint">
                            💡 엑셀 미리보기에서 영역을 두 번 클릭하세요.
                          </div>
                        )}

                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label>날짜 형식</label>
                          <select
                            value={periodOptions.dateFormat}
                            onChange={(e) => {
                              setPeriodOptions({
                                ...periodOptions,
                                dateFormat: e.target.value
                              });
                            }}
                            className="form-input"
                          >
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                            <option value="YYYY.MM.DD">YYYY.MM.DD</option>
                            <option value="YYYY년 MM월 DD일">YYYY년 MM월 DD일</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <p className="form-hint">
                      월별 내보내기 시 각 월의 초일부터 말일까지 자동으로 입력됩니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 증빙 문서 정보 */}
            {evidenceInfo.length > 0 && (
              <div className="export-settings-section">
                <h3 className="export-section-title">증빙 문서 정보</h3>
                <div className="evidence-info-list" style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid var(--accounting-gray-300)', borderRadius: 'var(--accounting-border-radius-sm)', padding: '12px' }}>
                  {evidenceInfo.map((info, idx) => (
                    <div key={idx} style={{ padding: '8px 0', borderBottom: idx < evidenceInfo.length - 1 ? '1px solid var(--accounting-gray-200)' : 'none' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{info.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--accounting-gray-600)' }}>
                        파일: {info.fileName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accounting-gray-500)' }}>
                        ID: {info.entryId}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="form-hint" style={{ marginTop: '12px', marginBottom: 0 }}>총 {evidenceInfo.length}개의 항목에 증빙 문서가 있습니다.</p>
              </div>
            )}

          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          </div>

          {/* 오른쪽: 엑셀 미리보기 */}
          <div style={{ flex: '0 0 50%', overflow: 'auto', border: '1px solid var(--accounting-gray-300)', borderRadius: 'var(--accounting-border-radius-sm)', background: 'white', position: 'relative' }}>
            {sheetHtml ? (
              <div 
                ref={excelPreviewRef}
                className="excel-preview-wrapper"
                style={{ 
                  position: 'relative',
                  width: '100%',
                  minHeight: '100%'
                }}
                dangerouslySetInnerHTML={{ __html: sheetHtml }}
              />
            ) : sheetData.length > 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accounting-gray-500)' }}>
                엑셀 양식을 불러오는 중...
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accounting-gray-500)' }}>
                엑셀 파일을 선택해주세요.
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ padding: '20px', borderTop: '1px solid var(--accounting-gray-200)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="btn-cancel"
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={isProcessing || !templateSpreadsheetId || !selectedSheet}
            className="btn-primary"
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                내보내는 중...
              </>
            ) : (
              '내보내기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

