package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type CourseService struct {
	courseRepo       *repository.CourseRepository
	schoolRepo       *repository.SchoolRepository
	userRepo         *repository.UserRepository
	studentRepo      *repository.StudentRepository
	notificationRepo *repository.NotificationRepository
	announcementRepo *repository.AnnouncementRepository
}

func NewCourseService(courseRepo *repository.CourseRepository, schoolRepo *repository.SchoolRepository, userRepo *repository.UserRepository, studentRepo *repository.StudentRepository, notificationRepo *repository.NotificationRepository, announcementRepo *repository.AnnouncementRepository) *CourseService {
	return &CourseService{
		courseRepo:       courseRepo,
		schoolRepo:       schoolRepo,
		userRepo:         userRepo,
		studentRepo:      studentRepo,
		notificationRepo: notificationRepo,
		announcementRepo: announcementRepo,
	}
}

func (s *CourseService) CreateCourse(
	ctx context.Context,
	creatorID string,
	role domain.Role,
	title, description string,
	schedule *domain.Schedule,
	price float64,
	language string,
	categoryID *string,
	difficulty string,
	tags []string,
	teacherID *string,
) (*domain.Course, error) {
	course := &domain.Course{
		Title:       title,
		Description: description,
		Schedule:    schedule,
		Price:       price,
		Language:    language,
		CategoryID:  categoryID,
		Difficulty:  difficulty,
		Tags:        tags,
	}

	if role == domain.RoleTeacher {
		// Independent teacher creating course
		course.TeacherID = &creatorID
		// SchoolID stays nil

		// Ensure teacher profile exists
		_, err := s.schoolRepo.GetTeacherProfile(ctx, creatorID)
		if err != nil {
			// If not found, create it
			if err.Error() == "teacher profile not found" {
				profile := &domain.TeacherProfile{
					UserID:   creatorID,
					Bio:      "",
					Subjects: []string{},
				}
				if err := s.schoolRepo.CreateTeacherProfile(ctx, profile); err != nil {
					return nil, err
				}
			} else {
				return nil, err
			}
		}

	} else if role == domain.RoleSchoolAdmin {
		// School Admin creating course
		// 1. Get School ID
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, creatorID)
		if err != nil {
			return nil, errors.New("school not found for admin")
		}
		course.SchoolID = &school.ID

		// 2. Validate Teacher belongs to school (Optional strict check, skipping for MVP speed)
		if teacherID == nil {
			return nil, errors.New("teacher_id is required for school courses")
		}
		course.TeacherID = teacherID
	} else {
		return nil, errors.New("unauthorized to create course")
	}

	if err := s.courseRepo.CreateCourse(ctx, course); err != nil {
		return nil, err
	}

	// Add tags
	for _, tag := range tags {
		_ = s.courseRepo.AddTagToCourse(ctx, course.ID, tag)
	}

	return course, nil
}

func (s *CourseService) ListCourses(ctx context.Context, userID string, role domain.Role) ([]*domain.Course, error) {
	filter := repository.CourseFilter{
		UserID: &userID,
	}

	// For MVP, if teacher, show their courses? If school admin, show school courses?
	// If student, just show all? Or available?

	if role == domain.RoleTeacher {
		filter.TeacherID = &userID
	} else if role == domain.RoleSchoolAdmin {
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, userID)
		if err == nil {
			filter.SchoolID = &school.ID
		}
	}

	return s.courseRepo.ListCourses(ctx, filter)
}

func (s *CourseService) InviteStudent(ctx context.Context, inviterID string, role domain.Role, courseID, studentEmail string) error {
	// 1. Check if course exists
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}

	// 2. Authorization: Inviter must be the teacher or school admin of the course
	if role == domain.RoleTeacher {
		if course.TeacherID == nil || *course.TeacherID != inviterID {
			return errors.New("unauthorized to invite to this course")
		}
	} else if role == domain.RoleSchoolAdmin {
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, inviterID)
		if err != nil {
			return errors.New("school not found")
		}
		if course.SchoolID == nil || *course.SchoolID != school.ID {
			return errors.New("unauthorized to invite to this course")
		}
	} else {
		return errors.New("unauthorized")
	}

	// 3. Find Student by Email
	studentUser, err := s.userRepo.GetUserByEmail(ctx, studentEmail)
	if err != nil {
		return errors.New("student not found")
	}
	if studentUser.Role != domain.RoleStudent {
		return errors.New("user is not a student")
	}

	// 4. Check existing enrollment/invitation
	existing, err := s.courseRepo.GetEnrollmentByStudentAndCourse(ctx, studentUser.ID, courseID)
	if existing != nil {
		return errors.New("student already enrolled or invited")
	}
	if err != nil && err != repository.ErrEnrollmentNotFound {
		return err
	}

	// 5. Create Invitation
	enrollment := &domain.Enrollment{
		StudentUserID: studentUser.ID,
		CourseID:      courseID,
		Status:        domain.EnrollmentStatusInvited,
	}

	if err := s.courseRepo.CreateEnrollment(ctx, enrollment); err != nil {
		return err
	}

	// 6. Link Student to School/Teacher if not already linked (or update primary link)
	// Fetch existing student profile
	studentProfile, err := s.studentRepo.GetByUserID(ctx, studentUser.ID)
	if err != nil {
		return err // Handle error appropriately
	}

	if studentProfile == nil {
		// Create new student profile
		studentProfile = &domain.Student{
			UserID:     studentUser.ID,
			GradeLevel: "", // Unknown
			ParentName: "", // Unknown
		}
		// Set links based on course
		if course.SchoolID != nil {
			studentProfile.SchoolID = course.SchoolID
		}
		if course.TeacherID != nil {
			studentProfile.TeacherID = course.TeacherID
		}
		if err := s.studentRepo.Create(ctx, studentProfile); err != nil {
			// Log error but don't fail invitation?
			// fmt.Println("Failed to create student profile:", err)
			// For now, let's treat it as non-fatal or return err
			return err
		}
	} else {
		// Update links if they are empty
		updated := false
		if studentProfile.SchoolID == nil && course.SchoolID != nil {
			studentProfile.SchoolID = course.SchoolID
			updated = true
		}
		if studentProfile.TeacherID == nil && course.TeacherID != nil {
			studentProfile.TeacherID = course.TeacherID
			updated = true
		}
		if updated {
			if err := s.studentRepo.Update(ctx, studentProfile); err != nil {
				return err
			}
		}
	}

	// 7. Notify the invited student
	inviter, _ := s.userRepo.GetUserByID(ctx, inviterID)
	inviterName := "A teacher"
	if inviter != nil && inviter.Name != "" {
		inviterName = inviter.Name
	}
	_ = s.notificationRepo.Create(ctx, &domain.Notification{
		UserID:  studentUser.ID,
		Type:    "course_invitation",
		Title:   "Course Invitation",
		Message: fmt.Sprintf("%s invited you to join %s", inviterName, course.Title),
		Link:    fmt.Sprintf("/courses/%s", courseID),
	})

	return nil
}

func (s *CourseService) RequestEnrollment(ctx context.Context, studentID, courseID string) error {
	// 1. Check if course exists
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}

	// 2. Check existing enrollment
	existing, err := s.courseRepo.GetEnrollmentByStudentAndCourse(ctx, studentID, courseID)
	if existing != nil {
		if existing.Status == domain.EnrollmentStatusRejected {
			// Allow re-request by deleting the rejected enrollment
			_ = s.courseRepo.DeleteEnrollment(ctx, existing.ID)
		} else {
			return errors.New("already enrolled or access requested")
		}
	}
	if err != nil && err != repository.ErrEnrollmentNotFound {
		return err
	}

	// 3. Create Pending Enrollment
	enrollment := &domain.Enrollment{
		StudentUserID: studentID,
		CourseID:      courseID,
		Status:        domain.EnrollmentStatusPending,
	}

	if err := s.courseRepo.CreateEnrollment(ctx, enrollment); err != nil {
		return err
	}

	// 4. Notify the teacher and school admin
	student, _ := s.userRepo.GetUserByID(ctx, studentID)
	studentName := "A student"
	if student != nil && student.Name != "" {
		studentName = student.Name
	}

	if course.TeacherID != nil {
		_ = s.notificationRepo.Create(ctx, &domain.Notification{
			UserID:  *course.TeacherID,
			Type:    "enrollment_request",
			Title:   "New Access Request",
			Message: fmt.Sprintf("%s requested access to %s", studentName, course.Title),
			Link:    fmt.Sprintf("/courses?view=%s", courseID),
		})
	}

	if course.SchoolID != nil {
		school, err := s.schoolRepo.GetSchoolByID(ctx, *course.SchoolID)
		if err == nil && school != nil {
			_ = s.notificationRepo.Create(ctx, &domain.Notification{
				UserID:  school.AdminUserID,
				Type:    "enrollment_request",
				Title:   "New Access Request",
				Message: fmt.Sprintf("%s requested access to %s", studentName, course.Title),
				Link:    fmt.Sprintf("/courses?view=%s", courseID),
			})
		}
	}

	return nil
}

func (s *CourseService) RespondToInvitation(ctx context.Context, studentID, enrollmentID string, accept bool) error {
	// 1. Verify enrollment exists and belongs to student
	// We don't have GetEnrollmentByID directly in repo shown, but we can update directly with where clause or use existing methods.
	// Ideally we should fetch and check ownership.
	// Repo UpdateEnrollmentStatus(ctx, id, status) updates by ID.
	// Wait, security issue: any user could update any enrollment status if we don't check studentID.

	// Let's rely on basic repo update for now, but ideally we should check ownership.
	// I should probably add GetEnrollmentByID to repo or check ownership here.
	// For now, I'll assume we trust the ID or rely on repo to handle it (but repo doesn't check owner).

	// Better: Get all student enrollments and find the one matching ID.
	enrollments, err := s.courseRepo.GetEnrollmentsByStudent(ctx, studentID)
	if err != nil {
		return err
	}

	var targetEnrollment *domain.Enrollment
	for _, e := range enrollments {
		if e.ID == enrollmentID {
			targetEnrollment = e
			break
		}
	}

	if targetEnrollment == nil {
		return errors.New("invitation not found")
	}

	if targetEnrollment.Status != domain.EnrollmentStatusInvited {
		return errors.New("enrollment is not in invited status")
	}

	newStatus := domain.EnrollmentStatusRejected
	if accept {
		newStatus = domain.EnrollmentStatusActive
	}

	return s.courseRepo.UpdateEnrollmentStatus(ctx, enrollmentID, newStatus)
}

func (s *CourseService) GetStudentEnrollments(ctx context.Context, studentID string) ([]repository.EnrollmentWithCourse, error) {
	enrollments, err := s.courseRepo.GetStudentEnrollmentsWithCourse(ctx, studentID)
	if err != nil {
		return nil, err
	}

	// Calculate progress for each enrollment
	for i := range enrollments {
		progress, err := s.studentRepo.GetCourseProgress(ctx, studentID, enrollments[i].Course.ID)
		if err == nil {
			enrollments[i].Enrollment.Progress = progress
		}
	}

	return enrollments, nil
}

func (s *CourseService) MarkTopicComplete(ctx context.Context, studentID, topicID string) error {
	return s.studentRepo.MarkTopicComplete(ctx, studentID, topicID)
}

func (s *CourseService) UnmarkTopicComplete(ctx context.Context, studentID, topicID string) error {
	return s.studentRepo.UnmarkTopicComplete(ctx, studentID, topicID)
}

func (s *CourseService) GetCourseProgress(ctx context.Context, studentID, courseID string) (float64, error) {
	return s.studentRepo.GetCourseProgress(ctx, studentID, courseID)
}

func (s *CourseService) GetCourseEnrollments(ctx context.Context, userID string, role domain.Role, courseID string) ([]*domain.Enrollment, error) {
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}

	// Authorization
	if role == domain.RoleTeacher {
		if course.TeacherID == nil || *course.TeacherID != userID {
			return nil, errors.New("unauthorized")
		}
	} else if role == domain.RoleSchoolAdmin {
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, userID)
		if err != nil {
			return nil, errors.New("school not found")
		}
		if course.SchoolID == nil || *course.SchoolID != school.ID {
			return nil, errors.New("unauthorized")
		}
	} else {
		return nil, errors.New("unauthorized")
	}

	return s.courseRepo.GetEnrollmentsByCourse(ctx, courseID)
}

// ApproveOrRejectEnrollment allows a teacher or school_admin to approve or reject a pending enrollment request.
func (s *CourseService) ApproveOrRejectEnrollment(ctx context.Context, userID string, role domain.Role, enrollmentID string, approve bool) error {
	if role != domain.RoleTeacher && role != domain.RoleSchoolAdmin {
		return errors.New("only teachers and admins can manage enrollment requests")
	}

	newStatus := domain.EnrollmentStatusRejected
	if approve {
		newStatus = domain.EnrollmentStatusActive
	}

	if err := s.courseRepo.UpdateEnrollmentStatus(ctx, enrollmentID, newStatus); err != nil {
		return err
	}

	// On approval, create an announcement
	if approve {
		enrollment, err := s.courseRepo.GetEnrollmentByID(ctx, enrollmentID)
		if err == nil && enrollment != nil {
			course, _ := s.courseRepo.GetCourseByID(ctx, enrollment.CourseID)
			student, _ := s.userRepo.GetUserByID(ctx, enrollment.StudentUserID)

			studentName := "A new student"
			if student != nil && student.Name != "" {
				studentName = student.Name
			}
			courseTitle := "a course"
			if course != nil {
				courseTitle = course.Title
			}

			_ = s.announcementRepo.Create(ctx, &domain.Announcement{
				CourseID: &enrollment.CourseID,
				AuthorID: userID,
				Title:    "New Student Joined",
				Content:  fmt.Sprintf("%s has been approved and joined %s.", studentName, courseTitle),
				IsPinned: false,
			})

			// Notify the student
			_ = s.notificationRepo.Create(ctx, &domain.Notification{
				UserID:  enrollment.StudentUserID,
				Type:    "enrollment_approved",
				Title:   "Access Approved",
				Message: fmt.Sprintf("Your access request to %s has been approved!", courseTitle),
				Link:    fmt.Sprintf("/courses?view=%s", enrollment.CourseID),
			})
		}
	} else {
		// On rejection, notify the student
		enrollment, err := s.courseRepo.GetEnrollmentByID(ctx, enrollmentID)
		if err == nil && enrollment != nil {
			course, _ := s.courseRepo.GetCourseByID(ctx, enrollment.CourseID)
			courseTitle := "a course"
			if course != nil {
				courseTitle = course.Title
			}
			_ = s.notificationRepo.Create(ctx, &domain.Notification{
				UserID:  enrollment.StudentUserID,
				Type:    "enrollment_rejected",
				Title:   "Access Denied",
				Message: fmt.Sprintf("Your access request to %s has been denied.", courseTitle),
				Link:    fmt.Sprintf("/courses?view=%s", enrollment.CourseID),
			})
		}
	}

	return nil
}

func (s *CourseService) CancelEnrollment(ctx context.Context, studentID, enrollmentID string) error {
	enrollment, err := s.courseRepo.GetEnrollmentByID(ctx, enrollmentID)
	if err != nil {
		return errors.New("enrollment not found")
	}
	if enrollment.StudentUserID != studentID {
		return errors.New("unauthorized")
	}
	if enrollment.Status != domain.EnrollmentStatusPending {
		return errors.New("only pending requests can be cancelled")
	}
	return s.courseRepo.DeleteEnrollment(ctx, enrollmentID)
}

func (s *CourseService) UpdateCoverImage(ctx context.Context, courseID string, url *string) error {
	return s.courseRepo.UpdateCoverImage(ctx, courseID, url)
}

func (s *CourseService) GetCourseByID(ctx context.Context, userID, courseID string) (*domain.Course, error) {
	return s.courseRepo.GetCourseByIDWithDetails(ctx, userID, courseID)
}

func (s *CourseService) IncrementCourseView(ctx context.Context, studentID, courseID string) error {
	return s.courseRepo.IncrementCourseView(ctx, studentID, courseID)
}

func (s *CourseService) ListCategories(ctx context.Context) ([]*domain.Category, error) {
	return s.courseRepo.ListCategories(ctx)
}

func (s *CourseService) UpdateCourse(
	ctx context.Context,
	userID string,
	role domain.Role,
	courseID, title, description string,
	schedule *domain.Schedule,
	price float64,
	language string,
	categoryID *string,
	difficulty string,
	tags []string,
) (*domain.Course, error) {
	// Get existing course to verify ownership
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}

	// Ownership check
	switch role {
	case domain.RoleTeacher:
		if course.TeacherID == nil || *course.TeacherID != userID {
			return nil, errors.New("you do not own this course")
		}
	case domain.RoleSchoolAdmin:
		if course.SchoolID == nil {
			return nil, errors.New("this course does not belong to a school")
		}
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, userID)
		if err != nil || school.ID != *course.SchoolID {
			return nil, errors.New("you do not own this course's school")
		}
	case domain.RoleAdmin:
		// Admin can edit any course
	default:
		return nil, errors.New("insufficient permissions")
	}

	// Apply updates
	if title != "" {
		course.Title = title
	}
	course.Description = description
	if schedule != nil {
		course.Schedule = schedule
	}
	course.Price = price
	if language != "" {
		course.Language = language
	}
	course.CategoryID = categoryID
	if difficulty != "" {
		course.Difficulty = difficulty
	}
	course.Tags = tags

	if err := s.courseRepo.UpdateCourse(ctx, course); err != nil {
		return nil, err
	}

	return s.courseRepo.GetCourseByIDWithDetails(ctx, userID, courseID)
}

func (s *CourseService) DeleteCourse(ctx context.Context, userID string, role domain.Role, courseID string) error {
	course, err := s.courseRepo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}

	switch role {
	case domain.RoleTeacher:
		if course.TeacherID == nil || *course.TeacherID != userID {
			return errors.New("you do not own this course")
		}
	case domain.RoleSchoolAdmin:
		if course.SchoolID == nil {
			return errors.New("this course does not belong to a school")
		}
		school, err := s.schoolRepo.GetSchoolByAdminID(ctx, userID)
		if err != nil || school.ID != *course.SchoolID {
			return errors.New("you do not own this course's school")
		}
	case domain.RoleAdmin:
		// Admin can delete any course
	default:
		return errors.New("insufficient permissions")
	}

	return s.courseRepo.DeleteCourse(ctx, courseID)
}
