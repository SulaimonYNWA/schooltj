package main

import (
	"context"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
	"github.com/schooltj/internal/service"
)

func main() {
	dbUser := "user"
	dbPass := "password"
	dbHost := "localhost"
	dbPort := "3307"
	dbName := "schoolcrm"

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", dbUser, dbPass, dbHost, dbPort, dbName)
	repo, err := repository.NewRepository(dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer repo.DB.Close()

	userRepo := repository.NewUserRepository(repo.DB)
	schoolRepo := repository.NewSchoolRepository(repo.DB)
	courseRepo := repository.NewCourseRepository(repo.DB)
	// We use service to handle password hashing
	authService := service.NewAuthService(userRepo, schoolRepo, "seed-secret")
	courseService := service.NewCourseService(courseRepo, schoolRepo, userRepo)
	schoolService := service.NewSchoolService(schoolRepo, authService, courseService)

	ctx := context.Background()

	// 1. Admin User
	fmt.Println("Seeding Admin...")
	_, err = authService.Register(ctx, "admin@school.tj", "admin123", domain.RoleAdmin)
	if err != nil {
		fmt.Printf("Admin creation skipped/failed (likely exists): %v\n", err)
	}

	// 2. Schools
	fmt.Println("Seeding Schools...")
	school1Admin, err := authService.Register(ctx, "director@gymnasium1.tj", "school123", domain.RoleSchoolAdmin)
	if err != nil {
		fmt.Printf("School 1 Admin exists, fetching email...\n")
		school1Admin, _ = userRepo.GetUserByEmail(ctx, "director@gymnasium1.tj")
	}

	if school1Admin != nil {
		_, err := repo.DB.Exec("UPDATE schools SET name = ?, city = 'Dushanbe' WHERE admin_user_id = ?", "Gymnasium #1", school1Admin.ID)
		if err != nil {
			log.Println("Failed to update School 1 details:", err)
		}
	}

	school2Admin, err := authService.Register(ctx, "admin@isd.tj", "school123", domain.RoleSchoolAdmin)
	if err != nil {
		school2Admin, _ = userRepo.GetUserByEmail(ctx, "admin@isd.tj")
	}
	if school2Admin != nil {
		_, err := repo.DB.Exec("UPDATE schools SET name = ?, city = 'Dushanbe' WHERE admin_user_id = ?", "International School of Dushanbe", school2Admin.ID)
		if err != nil {
			log.Println("Failed to update School 2 details:", err)
		}
	}

	// 3. Independent Teachers
	fmt.Println("Seeding Independent Teachers...")
	_, err = authService.Register(ctx, "teacher.independent@gmail.com", "teacher123", domain.RoleTeacher)

	// 4. School Teachers & Courses
	if school1Admin != nil {
		fmt.Println("Seeding School Teachers...")
		schoolTeacher, err := schoolService.AddTeacherToSchool(ctx, school1Admin.ID, "math@gymnasium1.tj", "teacher123", "Mathematics Teacher")
		if err != nil {
			fmt.Printf("School Teacher exists, fetching...\n")
			schoolTeacher, _ = userRepo.GetUserByEmail(ctx, "math@gymnasium1.tj")
		}

		if schoolTeacher != nil {
			// 5. Courses
			fmt.Println("Seeding Courses for Gymnasium #1...")

			// Check if course exists first to avoid duplicates or just try to create
			_, err = schoolService.CourseService.CreateCourse(ctx, school1Admin.ID, domain.RoleSchoolAdmin, "Algebra I", "Basic algebra for 9th grade", 150.00, &schoolTeacher.ID)
			if err != nil {
				fmt.Printf("Failed to create course (might exist): %v\n", err)
			}

			_, err = schoolService.CourseService.CreateCourse(ctx, school1Admin.ID, domain.RoleSchoolAdmin, "World History", "From Ancient times to modern era", 120.00, &schoolTeacher.ID)
		}
	}

	fmt.Println("Seeding Complete!")
}
