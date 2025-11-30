package validators

import (
	"strconv"
)

// IsValidCPF verifica se uma string de CPF é válida
func IsValidCPF(cpf string) bool {
	cpf = removeNonDigits(cpf)
	if len(cpf) != 11 || allDigitsSame(cpf) {
		return false
	}
	d1 := calculateVerifierDigit(cpf[:9])
	d2 := calculateVerifierDigit(cpf[:10])
	return cpf[9] == d1 && cpf[10] == d2
}

// IsValidCNPJ verifica se uma string de CNPJ é válida
func IsValidCNPJ(cnpj string) bool {
	cnpj = removeNonDigits(cnpj)
	if len(cnpj) != 14 || allDigitsSame(cnpj) {
		return false
	}

	weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	d1 := calculateCNPJVerifierDigit(cnpj[:12], weights1)

	weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	d2 := calculateCNPJVerifierDigit(cnpj[:13], weights2)

	d1Received, _ := strconv.Atoi(string(cnpj[12]))
	d2Received, _ := strconv.Atoi(string(cnpj[13]))

	return d1 == d1Received && d2 == d2Received
}

// Funções auxiliares
func allDigitsSame(s string) bool {
	for i := 1; i < len(s); i++ {
		if s[i] != s[0] {
			return false
		}
	}
	return true
}

func calculateVerifierDigit(base string) uint8 {
	sum := 0
	multiplier := len(base) + 1
	for i := 0; i < len(base); i++ {
		digit, _ := strconv.Atoi(string(base[i]))
		sum += digit * multiplier
		multiplier--
	}
	remainder := sum % 11
	if remainder < 2 {
		return '0'
	}
	return uint8('0' + (11 - remainder))
}

func calculateCNPJVerifierDigit(base string, weights []int) int {
	sum := 0
	for i, r := range base {
		digit, _ := strconv.Atoi(string(r))
		sum += digit * weights[i]
	}
	remainder := sum % 11
	if remainder < 2 {
		return 0
	}
	return 11 - remainder
}
