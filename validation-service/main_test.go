package main

import (
	"ani-seguros/validation-service/validators"
	"fmt"
	"testing"
)

func TestValidations(t *testing.T) {
	tests := []struct {
		name     string
		testFunc func() bool
		want     bool
	}{
		{
			name: "CPF Válido",
			testFunc: func() bool {
				return validators.IsValidCPF("529.982.247-25")
			},
			want: true,
		},
		{
			name: "CPF Inválido",
			testFunc: func() bool {
				return validators.IsValidCPF("111.111.111-11")
			},
			want: false,
		},
		{
			name: "Email Válido",
			testFunc: func() bool {
				return validators.IsValidEmail("usuario@exemplo.com")
			},
			want: true,
		},
		{
			name: "Email Inválido",
			testFunc: func() bool {
				return validators.IsValidEmail("usuario@.com")
			},
			want: false,
		},
		{
			name: "Telefone Válido",
			testFunc: func() bool {
				return validators.IsValidPhone("11999999999")
			},
			want: true,
		},
		{
			name: "Telefone Inválido",
			testFunc: func() bool {
				return validators.IsValidPhone("1199999999")
			},
			want: false,
		},
		{
			name: "Protocolo Válido",
			testFunc: func() bool {
				return validators.IsValidProtocol("ANI-20251106-00001")
			},
			want: true,
		},
		{
			name: "Protocolo Inválido",
			testFunc: func() bool {
				return validators.IsValidProtocol("ANI-2025-00001")
			},
			want: false,
		},
		{
			name: "Categoria Válida",
			testFunc: func() bool {
				return validators.IsValidCategory("maus_tratos")
			},
			want: true,
		},
		{
			name: "Categoria Inválida",
			testFunc: func() bool {
				return validators.IsValidCategory("categoria_invalida")
			},
			want: false,
		},
		{
			name: "Status Válido",
			testFunc: func() bool {
				return validators.IsValidStatus("em_analise")
			},
			want: true,
		},
		{
			name: "Status Inválido",
			testFunc: func() bool {
				return validators.IsValidStatus("status_invalido")
			},
			want: false,
		},
		{
			name: "Extensão de Arquivo Válida",
			testFunc: func() bool {
				return validators.IsValidFileExtension("imagem.jpg")
			},
			want: true,
		},
		{
			name: "Extensão de Arquivo Inválida",
			testFunc: func() bool {
				return validators.IsValidFileExtension("arquivo.exe")
			},
			want: false,
		},
		{
			name: "Tamanho de Arquivo Válido (Imagem < 10MB)",
			testFunc: func() bool {
				return validators.IsValidFileSize("foto.jpg", 5*1024*1024)
			},
			want: true,
		},
		{
			name: "Tamanho de Arquivo Inválido (Imagem > 10MB)",
			testFunc: func() bool {
				return validators.IsValidFileSize("foto.jpg", 15*1024*1024)
			},
			want: false,
		},
		{
			name: "Tamanho de Arquivo Válido (Vídeo < 50MB)",
			testFunc: func() bool {
				return validators.IsValidFileSize("video.mp4", 45*1024*1024)
			},
			want: true,
		},
		{
			name: "Tamanho de Arquivo Inválido (Vídeo > 50MB)",
			testFunc: func() bool {
				return validators.IsValidFileSize("video.mp4", 55*1024*1024)
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.testFunc()
			if got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			} else {
				fmt.Printf("✅ %s: passou\n", tt.name)
			}
		})
	}
}
