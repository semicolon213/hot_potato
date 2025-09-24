import React, { useState, useRef } from 'react';
import { useStudentManagement } from '../hooks/useStudentManagement';
import DocumentList from '../components/document/DocumentList';
import './Students.css';

interface StudentsProps {
  onPageChange: (pageName: string) => void;
  studentSpreadsheetId: string | null;
}

const Students: React.FC<StudentsProps> = ({ onPageChange, studentSpreadsheetId }) => {
  const {
    students,
    filteredStudents,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    filterOptions,
    exportToCSV,
    downloadExcelTemplate,
    handleExcelUpload,
    getAllYears,
    getCouncilTableData,
    studentColumns,
    councilColumns
  } = useStudentManagement(studentSpreadsheetId);

  const [activeTab, setActiveTab] = useState<'list' | 'council'>('list');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const years = getAllYears();
  const councilData = selectedYear ? getCouncilTableData(selectedYear) : [];

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await handleExcelUpload(file);
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        alert('파일 업로드에 실패했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="students-container">
        <div className="loading">학생 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="students-container">
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="students-container">
      <div className="students-header">
        <div className="header-left">
          <h1>학생 관리</h1>
          <div className="header-stats">
            <span className="stat-item">
              <span className="stat-number">{students.length}</span>
              <span className="stat-label">전체 학생</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{filteredStudents.length}</span>
              <span className="stat-label">표시 중</span>
            </span>
          </div>
        </div>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 학생 목록
          </button>
          <button 
            className={`tab-button ${activeTab === 'council' ? 'active' : ''}`}
            onClick={() => setActiveTab('council')}
          >
            👥 학생회
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="students-list">
          {/* 검색 및 필터 영역 */}
          <div className="search-filter-section">
            <div className="search-controls">
              <div className="search-input-group">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="이름, 학번, 주소, 직책으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="filter-controls">
                <button 
                  className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  🎛️ 필터 {showFilters ? '숨기기' : '보기'}
                </button>
                
                {(filters.grade || filters.state || filters.council) && (
                  <button 
                    className="clear-filters-btn"
                    onClick={() => setFilters({ grade: '', state: '', council: '' })}
                  >
                    🗑️ 초기화
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>🎓 학년</label>
                    <select
                      value={filters.grade}
                      onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="">전체 학년</option>
                      {filterOptions.grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>📊 상태</label>
                    <select
                      value={filters.state}
                      onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="">전체 상태</option>
                      {filterOptions.states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>👑 학생회 직책</label>
                    <select
                      value={filters.council}
                      onChange={(e) => setFilters(prev => ({ ...prev, council: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="">전체 직책</option>
                      {filterOptions.councilPositions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <div className="action-left">
              <button className="export-btn" onClick={exportToCSV}>
                <span className="btn-icon">⬇️</span>
                <span className="btn-text">CSV 다운로드</span>
              </button>
              <button 
                className="template-btn"
                onClick={downloadExcelTemplate}
              >
                <span className="btn-icon">📄</span>
                <span className="btn-text">양식 다운로드</span>
              </button>
              <button 
                className="import-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="btn-icon">📤</span>
                <span className="btn-text">일괄 업로드</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="action-right">
              <div className="result-info">
                <span className="result-text">
                  <span className="highlight">{filteredStudents.length}</span>명 표시 중
                </span>
                {filteredStudents.length !== students.length && (
                  <span className="total-text">
                    (전체 {students.length}명)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 학생 목록 테이블 - 기존 DocumentList 컴포넌트 사용 */}
        <DocumentList
          columns={studentColumns.map(col => ({
            ...col,
            sortable: true,
            render: col.key === 'council' ? (row: StudentWithCouncil) => (
              <div className="council-badges">
                {row.parsedCouncil.map((council, index) => (
                  <span key={index} className="council-badge">
                    {council.year && <span className="badge-year">{council.year}년</span>}
                    <span className="badge-position">{council.position}</span>
                  </span>
                ))}
              </div>
            ) : col.render
          }))}
          data={filteredStudents}
          onPageChange={onPageChange}
          title={`학생 목록 (${filteredStudents.length}명)`}
          sortConfig={sortConfig}
          onSort={handleSort}
          showViewAll={false}
        />
        </div>
      )}

      {activeTab === 'council' && (
        <div className="council-section">
          <div className="council-header">
            <h2>학생회 집행부</h2>
            <div className="year-selector">
              <label htmlFor="year-select">년도 선택:</label>
              <select 
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="year-select"
              >
                <option value="">년도를 선택하세요</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
          </div>

          {selectedYear ? (
            <div className="council-table">
        <DocumentList
          columns={councilColumns.map(col => ({
            ...col,
            sortable: true,
            render: col.key === 'position' ? (row: any) => (
              <span className="council-badge-single">
                <span className="badge-position">{row.position}</span>
              </span>
            ) : col.render
          }))}
          data={councilData}
          onPageChange={onPageChange}
          title={`${selectedYear}년 학생회 집행부`}
          sortConfig={sortConfig}
          onSort={handleSort}
          showViewAll={false}
        />
            </div>
          ) : (
            <div className="no-year-selected">
              년도를 선택하면 해당 년도의 학생회 집행부 목록을 볼 수 있습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Students;
