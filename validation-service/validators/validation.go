package validators

import (
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// IsValidEmail valida e-mails dos usuários
func IsValidEmail(email string) bool {
	// Verifica se o email está vazio ou é muito longo
	if email == "" || len(email) > 254 {
		return false
	}

	// Remove espaços em branco
	email = strings.TrimSpace(email)

	// Padrão mais robusto para validação de email
	pattern := `^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`
	match, _ := regexp.MatchString(pattern, email)

	if !match {
		return false
	}

	// Verifica se tem pelo menos um ponto após o @
	parts := strings.Split(email, "@")
	if len(parts) != 2 || !strings.Contains(parts[1], ".") {
		return false
	}

	return true
}

// IsValidPhone valida telefones brasileiros (fixo e celular)
func IsValidPhone(phone string) bool {
	// Remove caracteres não numéricos
	phone = removeNonDigits(phone)

	// Verifica se tem 10 (fixo) ou 11 (celular) dígitos
	if len(phone) != 10 && len(phone) != 11 {
		return false
	}

	// Verifica DDD válido (11-99)
	ddd, _ := strconv.Atoi(phone[:2])
	if ddd < 11 || ddd > 99 {
		return false
	}

	// Para celular (11 dígitos), primeiro dígito deve ser 9
	if len(phone) == 11 && phone[2] != '9' {
		return false
	}

	// Para telefone fixo (10 dígitos), primeiro dígito não pode ser 9
	if len(phone) == 10 && phone[2] == '9' {
		return false
	}

	return true
}

// IsValidProtocol valida o formato do protocolo de denúncia (ANI-YYYYMMDD-XXXXX)
func IsValidProtocol(protocol string) bool {
	pattern := `^ANI-\d{8}-\d{5}$`
	match, _ := regexp.MatchString(pattern, protocol)
	return match
}

// IsValidCategory valida categorias de denúncia
func IsValidCategory(category string) bool {
	validCategories := []string{
		"violencia_fisica",
		"negligencia",
		"abandono",
		"maus_tratos",
		"comercio_ilegal",
		"outro",
	}

	category = strings.ToLower(strings.TrimSpace(category))
	for _, valid := range validCategories {
		if category == valid {
			return true
		}
	}
	return false
}

// IsValidStatus valida status do fluxo da denúncia
func IsValidStatus(status string) bool {
	validStatus := []string{
		"CRIADA",
		"EM_ANALISE",
		"EM_INVESTIGACAO",
		"AGUARDANDO_INSPECAO",
		"RESOLVIDA",
		"CONCLUIDA",
		"ARQUIVADA",
	}

	status = strings.ToUpper(strings.TrimSpace(status))
	for _, valid := range validStatus {
		if status == valid {
			return true
		}
	}
	return false
}

// IsValidFileExtension valida extensões de arquivos de mídia
func IsValidFileExtension(filename string) bool {
	validExtensions := []string{
		".jpg", ".jpeg", ".png", ".gif", // imagens
		".mp4", ".avi", ".mov", // vídeos
		".mp3", ".wav", ".ogg", // áudio
		".pdf", ".doc", ".docx", // documentos
	}

	ext := strings.ToLower(filepath.Ext(filename))
	for _, valid := range validExtensions {
		if ext == valid {
			return true
		}
	}
	return false
}

// IsValidFileSize valida tamanho dos arquivos (50MB vídeos, 10MB imagens/áudio)
func IsValidFileSize(filename string, size int64) bool {
	const (
		MB                = 1024 * 1024
		MaxVideoSize      = 50 * MB
		MaxImageAudioSize = 10 * MB
	)

	ext := strings.ToLower(filepath.Ext(filename))

	// Verifica se é vídeo
	videoExts := []string{".mp4", ".avi", ".mov"}
	for _, vExt := range videoExts {
		if ext == vExt {
			return size <= MaxVideoSize
		}
	}

	// Para outros tipos de arquivo (imagens, áudio, documentos)
	return size <= MaxImageAudioSize
}

// removeNonDigits remove caracteres não numéricos
func removeNonDigits(s string) string {
	re := regexp.MustCompile(`\D`)
	return re.ReplaceAllString(s, "")
}
