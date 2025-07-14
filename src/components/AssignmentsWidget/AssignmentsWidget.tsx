// src/components/AssignmentsWidget/AssignmentsWidget.tsx
import React from 'react';
import styles from './AssignmentsWidget.module.css';

const AssignmentsWidget: React.FC = () => {
  const upcomingAssignments = [
    { id: 1, title: '보고서 작성: 인공지능 윤리', course: '인공지능 개론', dueDate: '2025-07-20' },
    { id: 2, title: 'SQL 쿼리 실습', course: '데이터베이스 시스템', dueDate: '2025-07-22' },
    { id: 3, title: '프로젝트 제안서 제출', course: '캡스톤 디자인', dueDate: '2025-07-25' },
  ];

  return (
    <div className={styles.assignmentsContent}>
      <p className={styles.intro}>제출해야 할 과제 목록입니다.</p>
      <ul className={styles.assignmentList}>
        {upcomingAssignments.map(assignment => (
          <li key={assignment.id} className={styles.assignmentItem}>
            <div className={styles.assignmentInfo}>
              <p className={styles.assignmentTitle}><i className="fas fa-clipboard-list"></i> {assignment.title}</p>
              <span className={styles.assignmentCourse}>{assignment.course}</span>
            </div>
            <span className={styles.dueDate}>~ {assignment.dueDate}</span>
          </li>
        ))}
      </ul>
      <button className={styles.moreButton}>전체 과제 현황 보기 <i className="fas fa-arrow-right"></i></button>
    </div>
  );
};

export default AssignmentsWidget;