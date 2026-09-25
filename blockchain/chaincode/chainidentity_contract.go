package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ChainIdentityContract provides functions for managing identity, access, and digital assets
type ChainIdentityContract struct {
	contractapi.Contract
}

type DigitalAssetToken struct {
	AssetID        string `json:"assetId"`
	TokenID        string `json:"tokenId"`
	Name           string `json:"name"`
	Classification string `json:"classification"`
	OwnerDID       string `json:"ownerDid"`
	OffchainHash   string `json:"offchainHash"`
	Status         string `json:"status"`
}

type Allocation struct {
	AssetID     string   `json:"assetId"`
	UserDID     string   `json:"userDid"`
	Permissions []string `json:"permissions"`
	Status      string   `json:"status"` // ACTIVE, REVOKED
}

// MintAsset registers and tokenizes an organizational asset
func (s *ChainIdentityContract) MintAsset(ctx contractapi.TransactionContextInterface, assetID string, tokenID string, name string, classification string, ownerDID string, offchainHash string) error {
	exists, err := ctx.GetStub().GetState(assetID)
	if err != nil {
		return err
	}
	if exists != nil {
		return fmt.Errorf("the asset %s already exists", assetID)
	}

	asset := DigitalAssetToken{
		AssetID:        assetID,
		TokenID:        tokenID,
		Name:           name,
		Classification: classification,
		OwnerDID:       ownerDID,
		OffchainHash:   offchainHash,
		Status:         "TOKENIZED",
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(assetID, assetJSON)
}

// CheckAccess enforces policy decision directly on chain
func (s *ChainIdentityContract) CheckAccess(ctx contractapi.TransactionContextInterface, userDID string, assetID string, action string) (bool, error) {
	key := fmt.Sprintf("alloc_%s_%s", assetID, userDID)
	allocJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, err
	}
	if allocJSON == nil {
		return false, fmt.Errorf("no active allocation found for %s on asset %s", userDID, assetID)
	}

	var alloc Allocation
	err = json.Unmarshal(allocJSON, &alloc)
	if err != nil {
		return false, err
	}

	if alloc.Status != "ACTIVE" {
		return false, fmt.Errorf("allocation is not active: status is %s", alloc.Status)
	}

	for _, p := range alloc.Permissions {
		if p == action {
			return true, nil
		}
	}

	return false, fmt.Errorf("permission %s not granted", action)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&ChainIdentityContract{})
	if err != nil {
		fmt.Printf("Error creating ChainIdentity chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting ChainIdentity chaincode: %s", err.Error())
	}
}
