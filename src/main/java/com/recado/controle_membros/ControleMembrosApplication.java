package com.recado.controle_membros;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/*
 * =====================================================================
 *  PONTO DE ENTRADA DO SISTEMA  (é aqui que tudo começa)
 * =====================================================================
 *
 *  BASE DO PROJETO (de que ele é formado):
 *    - Java 25 + Spring Boot 4.1.1 (framework que sobe o servidor web sozinho)
 *    - Spring MVC ........ recebe as requisições HTTP (/membros)
 *    - Spring Data JPA ... conversa com o banco sem escrever SQL
 *    - Hibernate ......... traduz a classe Membro <-> tabela "membros"
 *    - PostgreSQL ........ banco de dados real (ComunidadeRecado)
 *    - Front-end ......... HTML + CSS + JavaScript puro, servido pelo
 *                          próprio Spring (pasta resources/static)
 *
 *  CAMINHO DE UMA REQUISIÇÃO (arquitetura em camadas):
 *
 *    Navegador (app.js)
 *        |  fetch("/membros")
 *        v
 *    MembroController  -> recebe o HTTP e valida o JSON (@Valid)
 *        |
 *        v
 *    MembroService     -> regras de negócio (ex.: consagrado = ano 0)
 *        |
 *        v
 *    MembroRepository  -> acesso ao banco (save, findAll, ...)
 *        |
 *        v
 *    Membro (entidade) -> espelho da tabela "membros" no PostgreSQL
 */

// @SpringBootApplication = junção de 3 anotações:
//   @Configuration, @EnableAutoConfiguration e @ComponentScan.
// Ela faz o Spring varrer este pacote (com.recado.controle_membros e
// subpacotes) procurando @Controller, @Service, @Repository e @Entity.
@SpringBootApplication
public class ControleMembrosApplication {

	// main = método que o Java executa ao iniciar o programa.
	public static void main(String[] args) {

		// Sobe o servidor web embutido (Tomcat, porta 8080), conecta no
		// banco e registra todos os controllers/services encontrados.
		SpringApplication.run(
				ControleMembrosApplication.class,
				args
		);
	}
}