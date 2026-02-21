package main

import (
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
	"github.com/schooltj/internal/repository"
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

}
