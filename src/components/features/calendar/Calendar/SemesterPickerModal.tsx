import React, { useState } from 'react';
import useCalendarContext, { type DateRange, type CustomPeriod } from '../../../../hooks/features/calendar/useCalendarContext';

interface SemesterPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (scheduleData: {
        semesterStartDate: Date;
        finalExamsPeriod: DateRange;
        midtermExamsPeriod: DateRange;
        gradeEntryPeriod: DateRange;
        customPeriods: CustomPeriod[];
    }) => Promise<void>;
}

const SemesterPickerModal: React.FC<SemesterPickerModalProps> = ({ isOpen, onClose, onSave }) => {
    const {
        semesterStartDate,
        setSemesterStartDate,
        finalExamsPeriod,
        setFinalExamsPeriod,
        midtermExamsPeriod,
        setMidtermExamsPeriod,
        gradeEntryPeriod,
        setGradeEntryPeriod,
        customPeriods,
        setCustomPeriods,
    } = useCalendarContext();

    const [newPeriodName, setNewPeriodName] = useState("");

    if (!isOpen) {
        return null;
    }

    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleAddCustomPeriod = () => {
        if (!newPeriodName.trim()) {
            alert('추가할 항목의 이름을 입력해주세요.');
            return;
        }
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: newPeriodName,
            period: { start: null, end: null },
        };
        setCustomPeriods([...customPeriods, newPeriod]);
        setNewPeriodName("");
    };

    const handleAddMakeupPeriod = () => {
        const newPeriod = {
            id: `custom-${Date.now()}`,
            name: "보강기간",
            period: { start: null, end: null },
            type: "makeup",
        };
        setCustomPeriods([...customPeriods, newPeriod]);
    };

    const handleDateChange = (setter: (date: Date) => void, value: string) => {
        if (value) {
            const newDate = new Date(value);
            if (!isNaN(newDate.getTime())) {
                setter(newDate);
            }
        }
    };

    const handleCustomPeriodTagChange = (id: string, value: string) => {
        const updatedPeriods = customPeriods.map(p => {
            if (p.id === id) {
                return { ...p, type: value };
            }
            return p;
        });
        setCustomPeriods(updatedPeriods);
    };

    const handleCustomPeriodChange = (id: string, part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        const periodToUpdate = customPeriods.find(p => p.id === id);
        if (!periodToUpdate) return;

        const updatedPeriods = customPeriods.map(p => {
            if (p.id === id) {
                return { ...p, period: { ...p.period, [part]: newDate } };
            }
            return p;
        });
        setCustomPeriods(updatedPeriods);
    };

    const handleFinalExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setFinalExamsPeriod({ ...finalExamsPeriod, [part]: newDate });
    };

    const handleMidtermExamsPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setMidtermExamsPeriod({ ...midtermExamsPeriod, [part]: newDate });
    };

    const handleGradeEntryPeriodChange = (part: 'start' | 'end', value: string) => {
        if (!value) return;
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setGradeEntryPeriod({ ...gradeEntryPeriod, [part]: newDate });
    };

    const handleDeleteCustomPeriod = (id: string) => {
        if (window.confirm('이 항목을 정말로 삭제하시겠습니까?')) {
            const updatedPeriods = customPeriods.filter(p => p.id !== id);
            setCustomPeriods(updatedPeriods);
        }
    };

    const handleSave = async () => {
        try {
            for (const p of customPeriods) {
                if (!p.period.start || !p.period.end) {
                    alert(`'${p.name}' 기간의 시작일과 종료일을 모두 설정해주세요.`);
                    return;
                }
            }

            const allPeriods = [
                { name: '중간고사', period: midtermExamsPeriod },
                { name: '기말고사', period: finalExamsPeriod },
                { name: '성적입력 및 강의평가', period: gradeEntryPeriod },
                ...customPeriods.map(p => ({ name: p.name, period: p.period }))
            ];

            for (const item of allPeriods) {
                const { start, end } = item.period;
                if (start && end && start > end) {
                    alert(`'${item.name}' 기간의 종료일은 시작일보다 빠를 수 없습니다.`);
                    return;
                }
            }

            await onSave({
                semesterStartDate,
                finalExamsPeriod,
                midtermExamsPeriod,
                gradeEntryPeriod,
                customPeriods
            });
            onClose();
        } catch (error) {
            console.error("학사일정 저장 중 오류 발생:", error);
            alert("학사일정 저장 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인해주세요.");
        }
    };

    const handleCloseWithoutSaving = () => {
        onClose();
    };

    return (
        <div className="semester-picker-overlay" onClick={handleCloseWithoutSaving}>
            <div className="semester-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="date-selector-row">
                    <label htmlFor="semester-start-date">개강일</label>
                    <input
                        id="semester-start-date"
                        type="date"
                        value={formatDateForInput(semesterStartDate)}
                        onChange={(e) => handleDateChange(setSemesterStartDate, e.target.value)}
                    />
                </div>
                <div className="date-selector-row">
                    <label>중간고사</label>
                    <input
                        type="date"
                        value={formatDateForInput(midtermExamsPeriod.start)}
                        onChange={(e) => handleMidtermExamsPeriodChange('start', e.target.value)}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        value={formatDateForInput(midtermExamsPeriod.end)}
                        onChange={(e) => handleMidtermExamsPeriodChange('end', e.target.value)}
                    />
                </div>
                <div className="date-selector-row">
                    <label>기말고사</label>
                    <input
                        type="date"
                        value={formatDateForInput(finalExamsPeriod.start)}
                        onChange={(e) => handleFinalExamsPeriodChange('start', e.target.value)}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        value={formatDateForInput(finalExamsPeriod.end)}
                        onChange={(e) => handleFinalExamsPeriodChange('end', e.target.value)}
                    />
                </div>
                <div className="date-selector-row">
                    <label>성적입력 및 강의평가</label>
                    <input
                        type="date"
                        value={formatDateForInput(gradeEntryPeriod.start)}
                        onChange={(e) => handleGradeEntryPeriodChange('start', e.target.value)}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        value={formatDateForInput(gradeEntryPeriod.end)}
                        onChange={(e) => handleGradeEntryPeriodChange('end', e.target.value)}
                    />
                </div>

                {customPeriods.map(p => (
                    <div key={p.id} className="date-selector-row">
                        <label>{p.name}</label>
                        <input
                            type="date"
                            value={formatDateForInput(p.period.start)}
                            onChange={(e) => handleCustomPeriodChange(p.id, 'start', e.target.value)}
                        />
                        <span>~</span>
                        <input
                            type="date"
                            value={formatDateForInput(p.period.end)}
                            onChange={(e) => handleCustomPeriodChange(p.id, 'end', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="태그"
                            className="tag-input"
                            value={p.type || ''}
                            onChange={(e) => handleCustomPeriodTagChange(p.id, e.target.value)}
                        />
                        <button onClick={() => handleDeleteCustomPeriod(p.id)} className="delete-period-btn">삭제</button>
                    </div>
                ))}

                <div className="add-period-form" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="항목 이름"
                            value={newPeriodName}
                            onChange={(e) => setNewPeriodName(e.target.value)}
                        />
                        <button onClick={handleAddCustomPeriod}>추가</button>
                    </div>
                    <div style={{ position: 'absolute', right: 0 }}>
                        <button onClick={handleAddMakeupPeriod}>보강</button>
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={handleSave} className="done-btn">완료</button>
                    <button onClick={handleCloseWithoutSaving} className="close-btn">닫기</button>
                </div>
            </div>
        </div>
    );
};

export default SemesterPickerModal;