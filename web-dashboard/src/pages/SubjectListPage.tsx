/**
 * @file SubjectListPage.tsx
 * @description
 * Trang này là trung tâm của việc quản lý các đối tượng.
 * - Hiển thị danh sách tất cả các đối tượng trong một bảng.
 * - Cung cấp chức năng tìm kiếm/lọc trực tiếp trên danh sách.
 * - Cho phép người dùng thực hiện các hành động trên mỗi đối tượng: sửa và xóa.
 * - Có nút để điều hướng đến trang thêm đối tượng mới.
 * - Hiển thị thông báo (ví dụ: "Thêm thành công") được truyền từ các trang khác.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, deleteSubject, type Subject } from '../services/api';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

// ==================================================================
// STYLED COMPONENTS
// ==================================================================

const Card = styled.div` /*...*/ `;
const PageHeader = styled.div` /*...*/ `;
const PageTitle = styled.h1` /*...*/ `;
const AddButton = styled.button` /*...*/ `;
const SearchContainer = styled.div` /*...*/ `;
const SearchInput = styled.input` /*...*/ `;
const SearchIcon = styled(FaSearch)` /*...*/ `;
const Table = styled.table` /*...*/ `;
const TableHead = styled.thead` /*...*/ `;
const TableRow = styled.tr` /*...*/ `;
const TableCell = styled.td` /*...*/ `;
const ActionButtons = styled.div` /*...*/ `;
const IconButton = styled.button` /*...*/ `;

// Component Badge để hiển thị trạng thái với màu sắc tương ứng.
const StatusBadge = styled.span<{ status: string }>`
    /* ... */
`;

const CenteredMessage = styled.div` /*...*/ `;

// Animation cho thông báo biến mất.
const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
`;

// Component thông báo thành công/lỗi.
const Notification = styled.div`
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    color: #155724;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    // Áp dụng animation: giữ trong 4.5s, sau đó biến mất trong 0.5s.
    animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

// ==================================================================
// PAGE COMPONENT
// ==================================================================

const SubjectListPage: React.FC = () => {
    // --- HOOKS & STATE ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null); // State để biết đang xóa item nào (chỉ để hiển thị spinner).
    const [searchTerm, setSearchTerm] = useState(''); // State cho giá trị của ô tìm kiếm.
    const navigate = useNavigate();
    const location = useLocation();

    // State để quản lý thông báo thành công (ví dụ: sau khi thêm/sửa thành công và được điều hướng về).
    // `location.state` là cách để truyền dữ liệu giữa các trang khi điều hướng với react-router.
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

    // --- DATA FETCHING & SIDE EFFECTS ---

    // 1. Fetch danh sách đối tượng khi component mount.
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getSubjects();
                setSubjects(Array.isArray(data) ? data : []); // Đảm bảo subjects luôn là một mảng.
            } catch (e) {
                setError('Không thể tải danh sách đối tượng.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, []); // Mảng phụ thuộc rỗng `[]` đảm bảo effect này chỉ chạy một lần.

    // 2. Xử lý hiển thị và xóa thông báo thành công.
    useEffect(() => {
        if (successMessage) {
            // Xóa state từ history để khi người dùng refresh trang, thông báo không hiện lại.
            window.history.replaceState({}, document.title);
            // Đặt hẹn giờ để tự động ẩn thông báo sau 5 giây.
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            // Cleanup function: hủy hẹn giờ nếu component unmount.
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // --- MEMOIZED FILTERING ---
    // `useMemo` được dùng để tối ưu hóa hiệu năng.
    // Logic lọc chỉ chạy lại khi `subjects` hoặc `searchTerm` thay đổi, không chạy lại trên mỗi lần render.
    const filteredSubjects = useMemo(() => 
        subjects.filter(s => 
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [subjects, searchTerm]);

    // --- EVENT HANDLERS ---

    /**
     * Xử lý việc xóa một đối tượng.
     * @param {string} id - ID của đối tượng cần xóa.
     */
    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này? Hành động này không thể hoàn tác.')) {
            setDeletingId(id);
            try {
                await deleteSubject(id);
                // Cập nhật lại state `subjects` bằng cách loại bỏ đối tượng đã xóa.
                setSubjects(prev => prev.filter(s => s._id !== id));
            } catch (err) {
                alert('Xóa đối tượng thất bại. Vui lòng thử lại.');
            } finally {
                setDeletingId(null);
            }
        }
    };

    // --- RENDER LOGIC ---
    return (
        <>
            {successMessage && <Notification>{successMessage}</Notification>}

            <PageHeader>
                <PageTitle>Quản lý Đối tượng</PageTitle>
                <AddButton onClick={() => navigate('/subjects/add')}>
                    <FaPlus />
                    <span>Thêm Mới</span>
                </AddButton>
            </PageHeader>

            <Card>
                <SearchContainer>
                    <SearchIcon />
                    <SearchInput
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </SearchContainer>

                {loading ? (
                    <CenteredMessage><Spinner size={50} /></CenteredMessage>
                ) : error ? (
                    <CenteredMessage style={{ color: 'red' }}>{error}</CenteredMessage>
                ) : (
                    <Table>
                        <TableHead> {/* ... */}</TableHead>
                        <tbody>
                            {filteredSubjects.length > 0 ? filteredSubjects.map(s => (
                                <TableRow key={s._id}>
                                    <TableCell>{s.fullName}</TableCell>
                                    <TableCell>{s.username}</TableCell>
                                    <TableCell><StatusBadge status={s.status}>{s.status}</StatusBadge></TableCell>
                                    <TableCell style={{textAlign: 'right'}}>
                                        <ActionButtons>
                                            <IconButton onClick={() => navigate(`/subjects/edit/${s._id}`)} disabled={deletingId === s._id} title="Sửa">
                                                <FaEdit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(s._id)} disabled={deletingId === s._id} title="Xóa">
                                                {/* Hiển thị spinner ngay trên nút xóa khi đang thực hiện xóa */}
                                                {deletingId === s._id ? <Spinner size={18} /> : <FaTrash />}
                                            </IconButton>
                                        </ActionButtons>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <tr>
                                    <td colSpan={4}>
                                        <CenteredMessage>Không có đối tượng nào.</CenteredMessage>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </Card>
        </>
    );
};

export default SubjectListPage;
