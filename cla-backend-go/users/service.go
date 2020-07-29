// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

package users

import (
	"github.com/communitybridge/easycla/cla-backend-go/events"
	"github.com/communitybridge/easycla/cla-backend-go/gen/models"
	"github.com/communitybridge/easycla/cla-backend-go/user"
)

// Service interface for users
type Service interface {
	CreateUser(user *models.User, claUser *user.CLAUser) (*models.User, error)
	Save(user *models.UserUpdate, claUser *user.CLAUser) (*models.User, error)
	Delete(userID string, claUser *user.CLAUser) error
	GetUser(userID string) (*models.User, error)
	GetUserByLFUserName(lfUserName string) (*models.User, error)
	GetUserByUserName(userName string, fullMatch bool) (*models.User, error)
	GetUserByEmail(userEmail string) (*models.User, error)
	GetUserByGitHubUsername(gitHubUsername string) (*models.User, error)
	SearchUsers(field string, searchTerm string, fullMatch bool) (*models.Users, error)
}

type service struct {
	repo   UserRepository
	events events.Service
}

// NewService creates a new whitelist service
func NewService(repo UserRepository, events events.Service) Service {
	return service{
		repo,
		events,
	}
}

// CreateUser attempts to create a new user based on the specified model
func (s service) CreateUser(user *models.User, claUser *user.CLAUser) (*models.User, error) {
	userModel, err := s.repo.CreateUser(user)
	if err != nil {
		return nil, err
	}

	// System may need to create user accounts
	var lfUser = "easycla_system_user"
	if claUser != nil {
		lfUser = claUser.LFUsername
	}

	// Create an event - run as a go-routine
	s.events.LogEvent(&events.LogEventArgs{
		EventType:  events.UserCreated,
		UserModel:  userModel,
		LfUsername: lfUser,
		EventData:  &events.UserCreatedEventData{},
	})

	return userModel, nil
}

// Save saves/updates the user record
func (s service) Save(user *models.UserUpdate, claUser *user.CLAUser) (*models.User, error) {
	userModel, err := s.repo.Save(user)
	if err != nil {
		return nil, err
	}

	// Log the event
	s.events.LogEvent(&events.LogEventArgs{
		EventType:  events.UserUpdated,
		UserModel:  userModel,
		LfUsername: claUser.LFUsername,
		EventData:  &events.UserUpdatedEventData{},
	})

	return userModel, nil
}

// Delete deletes the user record
func (s service) Delete(userID string, claUser *user.CLAUser) error {
	err := s.repo.Delete(userID)
	if err != nil {
		return err
	}

	// Log the event
	s.events.LogEvent(&events.LogEventArgs{
		EventType: events.UserDeleted,
		UserID:    claUser.UserID,
		EventData: &events.UserDeletedEventData{
			DeletedUserID: userID,
		},
	})

	return nil
}

// GetUser attempts to locate the user by the user id field
func (s service) GetUser(userID string) (*models.User, error) {
	userModel, err := s.repo.GetUser(userID)
	if err != nil {
		return nil, err
	}

	return userModel, nil
}

// GetuserByLFUserName returns the user record associated with the LF Username value
func (s service) GetUserByLFUserName(lfUserName string) (*models.User, error) {
	return s.repo.GetUserByLFUserName(lfUserName)
}

// GetUserByUserName attempts to locate the user by the user name field
func (s service) GetUserByUserName(userName string, fullMatch bool) (*models.User, error) {
	userModel, err := s.repo.GetUserByUserName(userName, fullMatch)
	if err != nil {
		return nil, err
	}

	return userModel, nil
}

// GetUserByEmail fetches the user by email
func (s service) GetUserByEmail(userEmail string) (*models.User, error) {
	userModel, err := s.repo.GetUserByEmail(userEmail)
	if err != nil {
		return nil, err
	}

	return userModel, nil
}

// GetUserByGitHubUsername fetches the user by GitHub username
func (s service) GetUserByGitHubUsername(gitHubUsername string) (*models.User, error) {
	userModel, err := s.repo.GetUserByGitHubUsername(gitHubUsername)
	if err != nil {
		return nil, err
	}

	return userModel, nil
}

// SearchUsers attempts to locate the user by the searchField and searchTerm fields
func (s service) SearchUsers(searchField string, searchTerm string, fullMatch bool) (*models.Users, error) {
	userModel, err := s.repo.SearchUsers(searchField, searchTerm, fullMatch)
	if err != nil {
		return nil, err
	}

	return userModel, nil
}
