package main

import (
	"ani-seguros/validation-service/validators"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Configurar CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Endpoint de validação
	r.POST("/validate", func(c *gin.Context) {
		var request struct {
			Type  string      `json:"type" binding:"required"`
			Value interface{} `json:"value" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":  "JSON inválido",
				"detail": "Certifique-se de enviar os campos 'type' e 'value'",
			})
			return
		}

		var isValid bool
		var valueStr string

		// Converter value para string se não for um objeto
		if str, ok := request.Value.(string); ok {
			valueStr = str
		} else {
			// Se for um objeto (para validação de arquivo), converter para JSON
			jsonBytes, err := json.Marshal(request.Value)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de valor inválido"})
				return
			}
			valueStr = string(jsonBytes)
		}

		switch request.Type {
		case "cpf":
			isValid = validators.IsValidCPF(valueStr)
		case "cnpj":
			isValid = validators.IsValidCNPJ(valueStr)
		case "email":
			isValid = validators.IsValidEmail(valueStr)
		case "phone":
			isValid = validators.IsValidPhone(valueStr)
		case "protocol":
			isValid = validators.IsValidProtocol(valueStr)
		case "category":
			isValid = validators.IsValidCategory(valueStr)
		case "status":
			isValid = validators.IsValidStatus(valueStr)
		case "file-extension":
			isValid = validators.IsValidFileExtension(valueStr)
		case "file-size":
			var fileData struct {
				Name string `json:"name"`
				Size int64  `json:"size"`
			}
			if err := json.Unmarshal([]byte(valueStr), &fileData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Dados do arquivo inválidos"})
				return
			}
			isValid = validators.IsValidFileSize(fileData.Name, fileData.Size)
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Tipo de validação não suportado",
				"supportedTypes": []string{
					"cpf", "cnpj", "email", "phone", "protocol",
					"category", "status", "file-extension", "file-size",
				},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"type":  request.Type,
			"value": request.Value,
			"valid": isValid,
		})
	})

	// Iniciar servidor na porta 8080
	log.Println("Servidor de validação iniciado em http://localhost:8080")
	r.Run(":8080")
}
