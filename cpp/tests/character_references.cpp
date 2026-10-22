#include "../parser/MD4CParser.hpp"
#include "../wasm/ASTSerializer.hpp"
#include <iostream>
#include <iterator>

int main() {
  std::string input(std::istreambuf_iterator<char>(std::cin), {});
  Markdown::MD4CParser parser;
  std::cout << Markdown::ASTSerializer::serialize(*parser.parse(input));
}
