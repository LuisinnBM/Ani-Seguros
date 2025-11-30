// Funções de validação de CPF e telefone
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) 
    soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) 
    soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function validarTelefone(telefone) {
  telefone = telefone.replace(/\D/g, '');
  
  // Verifica se tem 10 (fixo) ou 11 (celular) dígitos
  if (telefone.length !== 10 && telefone.length !== 11) return false;
  
  // Verifica DDD válido (11-99)
  const ddd = parseInt(telefone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Para celular (11 dígitos), primeiro dígito deve ser 9
  if (telefone.length === 11 && telefone[2] !== '9') return false;
  
  // Para telefone fixo (10 dígitos), primeiro dígito não pode ser 9
  if (telefone.length === 10 && telefone[2] === '9') return false;
  
  return true;
}

// Adicionar validação aos campos CPF e telefone
document.addEventListener('DOMContentLoaded', function() {
  const cpfInput = document.querySelector('input[name="cpf"]');
  const phoneInput = document.querySelector('input[name="phone"]');
  
  if (cpfInput) {
    cpfInput.addEventListener('blur', function() {
      const cpf = this.value.replace(/\D/g, '');
      if (cpf && !validarCPF(cpf)) {
        alert('CPF inválido. Por favor, verifique.');
        this.value = '';
        this.focus();
      }
    });
  }
  
  if (phoneInput) {
    phoneInput.addEventListener('blur', function() {
      const phone = this.value.replace(/\D/g, '');
      if (phone && !validarTelefone(phone)) {
        alert('Telefone inválido. Use DDD + número (apenas números).');
        this.value = '';
        this.focus();
      }
    });
  }
});

// Função para validar arquivos antes do upload
function validarArquivo(file) {
  const extensoesPermitidas = [
    '.jpg', '.jpeg', '.png', '.gif', // imagens
    '.mp4', '.avi', '.mov', // vídeos
    '.mp3', '.wav', '.ogg', // áudio
    '.pdf', '.doc', '.docx' // documentos
  ];

  const extensao = '.' + file.name.split('.').pop().toLowerCase();
  if (!extensoesPermitidas.includes(extensao)) {
    return {
      valido: false,
      erro: `Tipo de arquivo não permitido: ${extensao}. Use: ${extensoesPermitidas.join(', ')}`
    };
  }

  const MB = 1024 * 1024;
  const ehVideo = ['.mp4', '.avi', '.mov'].includes(extensao);
  const tamanhoMaximo = ehVideo ? 50 * MB : 10 * MB;

  if (file.size > tamanhoMaximo) {
    const limite = ehVideo ? '50MB' : '10MB';
    return {
      valido: false,
      erro: `Arquivo muito grande (${Math.round(file.size/MB)}MB). Limite: ${limite}`
    };
  }

  return { valido: true };
}

// Adicionar validação de arquivos ao input de arquivo
document.getElementById('file').addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  let todosValidos = true;
  let mensagensErro = [];

  files.forEach(file => {
    const validacao = validarArquivo(file);
    if (!validacao.valido) {
      todosValidos = false;
      mensagensErro.push(validacao.erro);
    }
  });

  if (!todosValidos) {
    alert('Erro nos arquivos:\n' + mensagensErro.join('\n'));
    e.target.value = ''; // limpa o input
  }
});